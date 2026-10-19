import { synchronize } from '@nozbe/watermelondb/sync';
import { getLastPulledAt } from '@nozbe/watermelondb/sync/impl';

import { database } from './index';
import { USER_SCOPED_TABLE_NAMES } from './schema';
import { emitRejectedRecords } from './syncEvents';
import { api, getCurrentUserId } from '../api/client';
import { getData, removeValue, storeData } from '../utils/storageManager';
import { enqueuePendingUploads } from '../files/uploadQueue';
import { uuidv4 } from './utils/uuid';

const DEVICE_ID_KEY = 'syncDeviceId';
// Utilisateur à qui appartiennent les lignes locales des tables filtrées par utilisateur côté
// serveur (forfait internet CVGP, notifications de commentaire) — cf. `prepareUserScopedTables`.
// Clé conservée telle quelle depuis la v3 : la renommer forcerait un retéléchargement inutile.
const USER_SCOPED_DATA_OWNER_KEY = 'internetCreditsOwnerId';
// Compte (id `auth.User` du JWT) à qui appartient le contenu de la base locale — cf.
// `prepareLocalDatabaseOwner`. Jamais effacé à la déconnexion : c'est ce qui permet de reconnaître,
// à la connexion suivante, un compte différent du précédent.
const LOCAL_DATABASE_OWNER_KEY = 'localDatabaseOwnerId';
// Tables filtrées par utilisateur au pull, en plus de celles de `prepareUserScopedTables` : `issues`
// (localités d'intervention, plaintes enregistrées ou assignées — grm-backend/src/sync/views.py::
// _issue_visibility_filter) et le budget participatif (facilitateur propriétaire, SYNC_OWNED_MODELS).
const ACCOUNT_SCOPED_TABLE_NAMES = ['issues', 'phases', 'tasks', 'bp_projects', 'budget_allocations'];

// Colonnes de type date/datetime stockées en epoch ms côté WatermelonDB, mais attendues au
// format ISO-8601 par les DateTimeField Django côté serveur (grm-backend/src/sync/serializers.py).
const DATE_COLUMNS_BY_TABLE = {
  issues: ['created_date', 'intake_date', 'issue_date', 'resolution_date', 'reject_date', 'publish_date'],
  comments: ['due_at'],
  issue_status_stories: ['datetime'],
  reasons: ['due_at'],
  escalation_reasons: ['due_at'],
  escalation_levels: ['due_at'],
  phases: ['open_at', 'due_at', 'closed_at'],
  tasks: ['open_at', 'due_at', 'closed_at'],
  budget_allocations: ['entry_date'],
  internet_credit_campaigns: ['period', 'sent_date'],
  internet_credit_confirmations: ['confirmed_at'],
  issue_notifications: ['read_at'],
};

// Colonnes JSON stockées en chaîne côté WatermelonDB (colonne `string`), échangées sous forme de
// liste avec le serveur (JSONField Django, cf. grm-backend/src/sync/serializers.py).
const JSON_COLUMNS_BY_TABLE = {
  comments: ['notify_emails', 'notify_user_ids'],
};

function parseJsonOrNull(value) {
  if (typeof value !== 'string') return value ?? null;
  try {
    return value.trim() ? JSON.parse(value) : null;
  } catch (err) {
    return null;
  }
}

async function getDeviceId() {
  let deviceId = await getData(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = uuidv4();
    await storeData(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

function toISOStringOrNull(epochMs) {
  if (epochMs === null || epochMs === undefined) return null;
  return new Date(epochMs).toISOString();
}

/** Convertit les colonnes date epoch-ms (vers ISO-8601) et JSON (chaîne vers liste) d'un
 * enregistrement brut WatermelonDB. */
function serializeRecordForPush(tableName, raw) {
  const dateColumns = DATE_COLUMNS_BY_TABLE[tableName] || [];
  const record = { ...raw };
  for (const column of dateColumns) {
    if (column in record) {
      record[column] = toISOStringOrNull(record[column]);
    }
  }
  for (const column of JSON_COLUMNS_BY_TABLE[tableName] || []) {
    if (column in record) {
      record[column] = parseJsonOrNull(record[column]) ?? [];
    }
  }
  return record;
}

function toEpochMsOrNull(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value; // déjà en epoch ms — ne devrait pas arriver, mais defensif
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

/**
 * Convertit les colonnes date ISO-8601 (format par défaut des `DateTimeField` DRF, cf.
 * grm-backend/src/sync/serializers.py) d'un enregistrement reçu au pull vers l'epoch ms attendu
 * par WatermelonDB — symétrique de `serializeRecordForPush`. Sans cette conversion,
 * `sanitizedRaw` (WatermelonDB) traite toute valeur non numérique sur une colonne `type:
 * 'number'` comme invalide et la force à `0` (colonnes obligatoires) ou `null` (optionnelles) :
 * tout enregistrement reçu du serveur affichait donc "01-Jan-1970" au lieu de sa vraie date.
 */
function deserializeRecordForPull(tableName, raw) {
  const dateColumns = DATE_COLUMNS_BY_TABLE[tableName] || [];
  const record = { ...raw };
  for (const column of dateColumns) {
    if (column in record) {
      record[column] = toEpochMsOrNull(record[column]);
    }
  }
  for (const column of JSON_COLUMNS_BY_TABLE[tableName] || []) {
    if (column in record && record[column] !== null && typeof record[column] !== 'string') {
      record[column] = JSON.stringify(record[column]);
    }
  }
  // `created_at`/`updated_at` existent sur (quasiment) toutes les tables synchronisées et ne
  // sont jamais optionnelles côté schéma WatermelonDB : on ne doit donc jamais renvoyer `null`.
  if ('created_at' in record) record.created_at = toEpochMsOrNull(record.created_at) ?? 0;
  if ('updated_at' in record) record.updated_at = toEpochMsOrNull(record.updated_at) ?? 0;
  return record;
}

class ForceFullResyncError extends Error {}

/**
 * Synchronisation principale (pull + push) selon le protocole WatermelonDB.
 *
 * @param {Object} [options]
 * @param {(info: {phase: string, current?: number, total?: number}) => void} [options.onProgress]
 *   Appelé pendant un full resync forcé pour piloter une barre de progression UI
 *   (CLAUDE.md §9 : "l'application doit mettre l'utilisateur en attente avec un affichage de
 *   barre de progression" lors des téléchargements complets).
 */
/**
 * Un cycle pull+push WatermelonDB unique. `pullCountRef` est partagé entre plusieurs cycles
 * (cf. `runSync`) pour que la numérotation `onProgress({ phase: 'pull', current })` reste
 * continue sur l'ensemble pull-push-pull plutôt que de repartir de 1 au second cycle.
 *
 * Retourne `{ pushed, rejected }` : `pushed` vaut `true` si `pushChanges` a réellement envoyé au
 * moins un enregistrement (création/modif/suppression locale). Utilisé par `runSync` pour décider
 * s'il faut enchaîner un second cycle (le 2e pull n'a d'intérêt que pour récupérer l'écho d'un
 * push qui a eu lieu). `rejected` : ids refusés par le serveur, par table (cf.
 * `purgeRejectedRecords`).
 *
 * `fullTables` : tables à recevoir intégralement plutôt qu'en diff (cf. `prepareUserScopedTables`).
 */
async function performSyncCycle({ deviceId, onProgress, pullCountRef, fullTables = [] }) {
  let cursor = null;
  let pushed = false;
  let rejected = null;

  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
      // Tables créées par une migration de schéma depuis la dernière sync (ex. v3 : forfait
      // internet CVGP) : leurs lignes serveur antérieures à `lastPulledAt` ne seraient jamais
      // envoyées par un pull incrémental — le serveur les renvoie donc en entier (`full_tables`).
      const tablesToFetchInFull = [...new Set([...(migration?.tables || []), ...fullTables])];
      const { data } = await api.get('/sync/pull/', {
        params: {
          last_pulled_at: lastPulledAt ?? 0,
          schema_version: schemaVersion,
          cursor: cursor ?? undefined,
          device_id: deviceId,
          full_tables: tablesToFetchInFull.length ? tablesToFetchInFull.join(',') : undefined,
        },
      });

      if (data.force_full_resync) {
        throw new ForceFullResyncError();
      }

      cursor = data.has_more ? data.cursor : null;
      pullCountRef.count += 1;
      onProgress?.({ phase: 'pull', current: pullCountRef.count });

      const deserializedChanges = {};
      for (const [tableName, tableChanges] of Object.entries(data.changes || {})) {
        deserializedChanges[tableName] = {
          created: (tableChanges.created || []).map((r) => deserializeRecordForPull(tableName, r)),
          updated: (tableChanges.updated || []).map((r) => deserializeRecordForPull(tableName, r)),
          deleted: tableChanges.deleted || [],
        };
      }

      return {
        changes: deserializedChanges,
        timestamp: data.timestamp,
        hasMore: data.has_more,
      };
    },

    pushChanges: async ({ changes, lastPulledAt }) => {
      const hasLocalChanges = Object.values(changes).some(
        (t) => (t.created?.length || 0) + (t.updated?.length || 0) + (t.deleted?.length || 0) > 0
      );
      if (!hasLocalChanges) return; // rien à pousser : n'appelle même pas l'API
      pushed = true;

      const serializedChanges = {};
      for (const [tableName, tableChanges] of Object.entries(changes)) {
        serializedChanges[tableName] = {
          created: (tableChanges.created || []).map((r) => serializeRecordForPush(tableName, r)),
          updated: (tableChanges.updated || []).map((r) => serializeRecordForPush(tableName, r)),
          deleted: tableChanges.deleted || [],
        };
      }
      const response = await api.post('/sync/push/', {
        changes: serializedChanges,
        last_pulled_at: lastPulledAt,
        device_id: deviceId,
      });
      // 200 + `rejected` : certains enregistrements (confirmations de forfait hors périmètre,
      // forfait supprimé entre-temps...) ont été refusés sans faire échouer le push.
      rejected = response?.data?.rejected || null;
    },

    migrationsEnabledAtVersion: 1,
    sendCreatedAsUpdated: true, // simplifie le traitement côté Django (cf. §3.4.1)
  });

  return { pushed, rejected };
}

/**
 * Supprime localement les enregistrements refusés par le serveur au push. `synchronize()` les a
 * déjà marqués comme synchronisés (le push a répondu 200) : sans ce nettoyage ils resteraient
 * affichés comme « confirmés » sur l'appareil alors qu'ils n'existent pas côté serveur. Le
 * retrait d'une confirmation de forfait fait réapparaître la notification correspondante.
 */
async function purgeRejectedRecords(rejected) {
  if (!rejected) return;
  const toDestroy = [];
  for (const [tableName, ids] of Object.entries(rejected)) {
    if (!ids?.length) continue;
    const records = await database.get(tableName).query().fetch();
    const rejectedIds = new Set(ids.map(String));
    records.filter((r) => rejectedIds.has(r.id)).forEach((r) => toDestroy.push(r));
  }
  if (toDestroy.length) {
    await database.write(async () => {
      await database.batch(...toDestroy.map((r) => r.prepareDestroyPermanently()));
    });
  }
  emitRejectedRecords(rejected);
}

async function destroyAllLocalRecords(tableNames) {
  const records = [];
  for (const tableName of tableNames) {
    records.push(...(await database.get(tableName).query().fetch()));
  }
  if (!records.length) return;
  await database.write(async () => {
    await database.batch(...records.map((r) => r.prepareDestroyPermanently()));
  });
}

/**
 * Les tables du forfait internet CVGP (membre CVGP : sa ligne ; FC/AC : les CVD de son périmètre)
 * et les notifications de commentaire (destinataire) sont filtrées par utilisateur au pull. Si
 * un autre compte que celui qui les a reçues se
 * connecte sur l'appareil, on les vide et on demande au serveur de les renvoyer intégralement :
 * sinon ce compte verrait les notifications du précédent, et ne recevrait jamais les siennes
 * (déjà antérieures à `lastPulledAt`). Retourne les tables à recevoir en entier et une fonction
 * à appeler une fois la synchronisation réussie.
 */
async function prepareUserScopedTables() {
  const userId = await getCurrentUserId();
  const owner = await getData(USER_SCOPED_DATA_OWNER_KEY);
  if (!userId || String(owner) === String(userId)) {
    return { fullTables: [], commit: async () => {} };
  }
  await destroyAllLocalRecords(USER_SCOPED_TABLE_NAMES);
  return {
    fullTables: USER_SCOPED_TABLE_NAMES,
    commit: async () => storeData(USER_SCOPED_DATA_OWNER_KEY, String(userId)),
  };
}

/** Appelée à la déconnexion (store/ducks/authentication.duck.js::logout), comme `clearLocalAdls`.
 * Oublie aussi le propriétaire : la prochaine connexion (même compte ou non) redemande ces tables
 * en entier, puisqu'un pull incrémental ne renverrait pas les lignes qu'on vient de vider. */
export async function clearLocalUserScopedData() {
  await removeValue(USER_SCOPED_DATA_OWNER_KEY);
  await destroyAllLocalRecords(USER_SCOPED_TABLE_NAMES);
}

/**
 * Le pull est incrémental (depuis `lastPulledAt`) et plusieurs tables sont filtrées par
 * utilisateur (ACCOUNT_SCOPED_TABLE_NAMES) : un autre compte qui se connectait sur l'appareil ne
 * recevait que les lignes modifiées depuis la dernière synchronisation du compte précédent, jamais
 * le reste de son propre périmètre — sa liste de plaintes restait vide, même après une
 * synchronisation manuelle, tant que les données de l'application n'étaient pas effacées.
 *
 * - Autre compte que celui de la base locale : on la vide (comme `forceFullResync`) pour
 *   retélécharger tout l'état serveur du nouveau compte, ce qui retire aussi de l'appareil les
 *   données du précédent. À faire avant tout envoi, fichiers compris : les modifications non
 *   synchronisées du compte précédent ne doivent pas partir avec le jeton du nouveau (le serveur
 *   refuse les plaintes d'un autre compte, `_issue_owned_by`, ce qui bloquait chaque
 *   synchronisation) — la déconnexion prévient quand il en reste (WorkInProgress).
 * - Propriétaire inconnu (base déjà synchronisée avant ce suivi) : rien n'est vidé, ces tables
 *   sont simplement redemandées en entier une fois.
 */
async function prepareLocalDatabaseOwner({ onProgress }) {
  const noChange = { fullTables: [], commit: async () => {} };
  const userId = await getCurrentUserId();
  const owner = await getData(LOCAL_DATABASE_OWNER_KEY);
  if (!userId || String(owner) === String(userId)) return noChange;

  const storeOwner = async () => storeData(LOCAL_DATABASE_OWNER_KEY, String(userId));
  if (owner === null || owner === undefined) {
    // Jamais synchronisée : le premier pull renvoie déjà tout.
    const alreadyPulled = Boolean(await getLastPulledAt(database));
    return { fullTables: alreadyPulled ? ACCOUNT_SCOPED_TABLE_NAMES : [], commit: storeOwner };
  }
  await forceFullResync({ onProgress });
  // Enregistré tout de suite, pas après la synchronisation : si celle-ci échoue, la suivante ne
  // doit pas revider une base qui contient peut-être déjà des saisies du nouveau compte.
  await storeOwner();
  return noChange;
}

export async function runSync({ onProgress } = {}) {
  const deviceId = await getDeviceId();
  const pullCountRef = { count: 0 };

  // Avant tout envoi, fichiers compris (cf. prepareLocalDatabaseOwner).
  const localDatabaseOwner = await prepareLocalDatabaseOwner({ onProgress });

  // Doit impérativement passer AVANT `synchronize()` (push compris), pas après : `reasons`/
  // `escalation_reasons` peuvent référencer un `attachment_id` (ex. PDF de résolution/escalade,
  // photo) qui n'existe encore que localement tant que ce flux fichier séparé (CLAUDE.md §3.7)
  // n'a pas tourné. Si le push JSON passait en premier, Django rejette ces enregistrements en 400
  // (`PrimaryKeyRelatedField` : la pièce jointe référencée n'existe pas encore côté serveur) — et
  // comme `transaction.atomic()` annule tout le lot et que `synchronize()` lève alors une erreur,
  // le flux fichier (qui aurait justement créé cette pièce jointe et débloqué la situation) n'était
  // plus jamais atteint : la même erreur se reproduisait indéfiniment à chaque sync périodique
  // (30s), sans jamais pouvoir se corriger d'elle-même.
  await enqueuePendingUploads();

  const userScopedTables = await prepareUserScopedTables();

  try {
    // 1er cycle : pull (état serveur courant) puis push (envoi des créations/modifs locales).
    const { pushed, rejected } = await performSyncCycle({
      deviceId,
      onProgress,
      pullCountRef,
      fullTables: [...userScopedTables.fullTables, ...localDatabaseOwner.fullTables],
    });
    await purgeRejectedRecords(rejected);
    await userScopedTables.commit();
    await localDatabaseOwner.commit();

    // 2e cycle (pull-push-pull) UNIQUEMENT si le 1er a réellement poussé quelque chose : son
    // pull sert à récupérer l'écho du push (champs recalculés côté serveur, ex.
    // `auto_increment_id`). S'il n'y a rien eu à pousser, ce 2e pull ne ferait que re-télécharger
    // un état déjà à jour — inutile ; les changements concurrents d'autres utilisateurs seront
    // repris au prochain cycle périodique.
    if (pushed) {
      const second = await performSyncCycle({ deviceId, onProgress, pullCountRef });
      await purgeRejectedRecords(second.rejected);
    }
  } catch (err) {
    if (err instanceof ForceFullResyncError) {
      await forceFullResync({ onProgress });
      return runSync({ onProgress }); // reprend un cycle normal une fois la base vidée
    }
    throw err;
  }

  // Un envoi manuel ("Envoyer les fichiers maintenant", IssueActions/CitizenReportStep3) ou une
  // sync précédente ayant échoué en cours de route a pu laisser de nouvelles pièces jointes
  // locales créées APRÈS le passage ci-dessus mais avant la fin de ce cycle — deuxième passage
  // pour les rattraper sans attendre le prochain cycle de 30s. Idempotent (ne retente que
  // `upload_status !== 'done'`), donc sans effet si le premier passage a déjà tout envoyé (cas
  // courant). Le téléchargement des pièces jointes distantes reste volontairement PAS automatique
  // ici — uniquement à la demande (cf. files/downloadQueue.js::downloadAttachmentById).
  await enqueuePendingUploads();
}

/**
 * Vide entièrement la base locale et retélécharge tout l'état serveur. Déclenché quand
 * `last_pulled_at` du client est trop ancien pour un diff incrémental fiable (les tombstones de
 * suppression ont pu être purgées côté serveur, cf. issue.tasks.cleanup_old_tombstones) —
 * CLAUDE.md §9.
 */
async function forceFullResync({ onProgress }) {
  onProgress?.({ phase: 'reset' });
  await database.write(async () => {
    await database.unsafeResetDatabase();
  });
}

/**
 * Vide la table locale `adls` (référentiel des facilitateurs, pull seul — cf. CLAUDE.md §2)
 * appelée à la déconnexion (store/ducks/authentication.duck.js::logout) : elle ne doit contenir,
 * sur cet appareil, que le facilitateur actuellement connecté ; la conserver après déconnexion
 * exposerait son profil (nom, périmètre administratif...) à quiconque se connecte ensuite avec un
 * autre compte sur le même appareil, avant même le premier pull qui la repeuplerait.
 *
 * Suppression physique (`destroyPermanently`) plutôt que `markAsDeleted()` : cette table n'est de
 * toute façon jamais poussée au serveur (absente de `SYNC_WRITABLE_MODELS` côté backend), une
 * tombstone locale n'aurait donc aucun effet utile — juste une ligne fantôme en plus jusqu'au
 * prochain pull.
 */
export async function clearLocalAdls() {
  const adlsCollection = database.get('adls');
  const localAdls = await adlsCollection.query().fetch();
  if (localAdls.length === 0) return;

  await database.write(async () => {
    await database.batch(...localAdls.map((adl) => adl.prepareDestroyPermanently()));
  });
}

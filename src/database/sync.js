import { synchronize } from '@nozbe/watermelondb/sync';

import { database } from './index';
import { api } from '../api/client';
import { getData, storeData } from '../utils/storageManager';
import { enqueuePendingUploads } from '../files/uploadQueue';
import { uuidv4 } from './utils/uuid';

const DEVICE_ID_KEY = 'syncDeviceId';

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
};

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

/** Convertit les colonnes date epoch-ms d'un enregistrement brut WatermelonDB vers ISO-8601. */
function serializeRecordForPush(tableName, raw) {
  const dateColumns = DATE_COLUMNS_BY_TABLE[tableName] || [];
  const record = { ...raw };
  for (const column of dateColumns) {
    if (column in record) {
      record[column] = toISOStringOrNull(record[column]);
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
export async function runSync({ onProgress } = {}) {
  const deviceId = await getDeviceId();
  let cursor = null;
  let pullCount = 0;

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

  try {
    await synchronize({
      database,
      pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
        const { data } = await api.get('/sync/pull/', {
          params: {
            last_pulled_at: lastPulledAt ?? 0,
            schema_version: schemaVersion,
            cursor: cursor ?? undefined,
            device_id: deviceId,
          },
        });

        if (data.force_full_resync) {
          throw new ForceFullResyncError();
        }

        cursor = data.has_more ? data.cursor : null;
        pullCount += 1;
        onProgress?.({ phase: 'pull', current: pullCount });

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
        const serializedChanges = {};
        for (const [tableName, tableChanges] of Object.entries(changes)) {
          serializedChanges[tableName] = {
            created: (tableChanges.created || []).map((r) => serializeRecordForPush(tableName, r)),
            updated: (tableChanges.updated || []).map((r) => serializeRecordForPush(tableName, r)),
            deleted: tableChanges.deleted || [],
          };
        }
        await api.post('/sync/push/', {
          changes: serializedChanges,
          last_pulled_at: lastPulledAt,
          device_id: deviceId,
        });
      },

      migrationsEnabledAtVersion: 1,
      sendCreatedAsUpdated: true, // simplifie le traitement côté Django (cf. §3.4.1)
    });
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

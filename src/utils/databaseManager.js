import { Q } from '@nozbe/watermelondb';
import { database } from '../database';
import { getData, storeData } from './storageManager';
import API from '../services/API';
import { ensureAdministrativeLevelsSynced } from '../database/watermelonSyncManager';

// Résout la commune/le village gérés par l'ADL depuis le cache local `administrative_regions`
// (alimenté par syncAdministrativeLevels(), CLAUDE.md §4.7) plutôt que par un appel réseau.
const resolveUserCommune = async (administrativeId) => {
  if (!administrativeId) return null;
  if(administrativeId == "1"){
    return {
      administrative_id: "1",
      name: "TOGO",
      type: "Country",
    };
  }
  const regions = await database
    .get('administrative_regions')
    .query(Q.where('server_id', Number(administrativeId)))
    .fetch();
  const region = regions[0];
  if (!region) return null;
  return {
    administrative_id: region.serverId ?? region.server_id,
    name: region.name,
    type: region.type,
  };
};

const REGION_TYPE = 'Region';
const PREFECTURE_TYPE = 'Prefecture';
const COMMUNE_TYPE = 'Commune';
const CANTON_TYPE = 'Canton';
const VILLAGE_TYPE = 'Village';

const findChildren = async (regionsTable, row) =>
  regionsTable.query(Q.where('parent_id', row.serverId ?? row.server_id)).fetch();

// Descente générique (récursive) : utilisée seulement en filet de sécurité, pour un `type`
// inattendu ou absent (cache local incomplet, hiérarchie non standard) — les niveaux connus
// (Région, Préfecture, Commune) sont traités explicitement dans `resolveCantonsForId` ci-dessous,
// où la profondeur de descente jusqu'au Canton est fixe et donc plus sûre à écrire à plat.
const findCantonDescendants = async (regionsTable, row) => {
  if (row.type === CANTON_TYPE) return [row];
  const children = await findChildren(regionsTable, row);
  const cantons = [];
  for (const child of children) {
    if (child.type === CANTON_TYPE) {
      cantons.push(child);
    } else {
      cantons.push(...(await findCantonDescendants(regionsTable, child)));
    }
  }
  return cantons;
};

// Remonte depuis `row` (un Village) jusqu'à son Canton parent, en suivant `parent_id` à l'envers.
const findCantonAncestor = async (regionsTable, row) => {
  let current = row;
  while (current && current.type !== CANTON_TYPE) {
    if (!current.parentId) return null;
    const [parent] = await regionsTable.query(Q.where('server_id', Number(current.parentId))).fetch();
    current = parent;
  }
  return current;
};

// Résout, pour un id donné (pays, région, préfecture, commune, canton ou village), l'ensemble des
// Cantons concernés. La hiérarchie est fixe (Région -> Préfecture -> Commune -> Canton -> Village,
// vérifié sur les données réelles de `mis`) : Région/Préfecture/Commune sont donc traitées
// explicitement, chacune avec le nombre de niveaux à descendre qui lui correspond, plutôt que de
// s'appuyer uniquement sur la récursion générique.
const resolveCantonsForId = async (regionsTable, id) => {
  if (["1", 1].includes(id)) {
    return regionsTable.query(Q.where('type', CANTON_TYPE)).fetch();
  }
  const [row] = await regionsTable.query(Q.where('server_id', Number(id))).fetch();
  if (!row) return [];

  switch (row.type) {
    case CANTON_TYPE:
      return [row];

    case VILLAGE_TYPE: {
      const canton = await findCantonAncestor(regionsTable, row);
      return canton ? [canton] : [];
    }

    case COMMUNE_TYPE:
      // Commune -> Canton (un seul niveau).
      return findChildren(regionsTable, row);

    case PREFECTURE_TYPE: {
      // Préfecture -> Commune -> Canton (deux niveaux).
      const communes = await findChildren(regionsTable, row);
      const cantons = [];
      for (const commune of communes) {
        cantons.push(...(await findChildren(regionsTable, commune)));
      }
      return cantons;
    }

    case REGION_TYPE: {
      // Région -> Préfecture -> Commune -> Canton (trois niveaux).
      const prefectures = await findChildren(regionsTable, row);
      const cantons = [];
      for (const prefecture of prefectures) {
        const communes = await findChildren(regionsTable, prefecture);
        for (const commune of communes) {
          cantons.push(...(await findChildren(regionsTable, commune)));
        }
      }
      return cantons;
    }

    default:
      // Type inattendu/absent : filet de sécurité générique plutôt que de perdre ce niveau.
      return findCantonDescendants(regionsTable, row);
  }
};

// Reconstruit `administrative_regions_objects` : uniquement des cantons imbriquant leurs villages
// (jamais une région/préfecture/commune en tête de liste), quel que soit le niveau réel des ids
// fournis. `ids` peut mélanger des niveaux hétérogènes (région, préfecture, commune, canton,
// village) et/ou l'id spécial du pays ("1", racine virtuelle sans ligne propre dans
// `administrative_regions` — même convention que resolveUserCommune ci-dessus) : chaque id est
// d'abord ramené à son ou ses cantons (`resolveCantonsForId`) avant de construire l'entrée
// canton -> villages. Le cache local `administrative_regions` (alimenté par
// syncAdministrativeLevels()) est la seule source.
const resolveAdministrativeRegionsObjects = async (ids) => {
  const uniqueIds = [...new Set((ids || []).filter(Boolean).map(String))];
  if (uniqueIds.length === 0) return [];

  const regionsTable = database.get('administrative_regions');
  const cantonsById = new Map();
  for (const id of uniqueIds) {
    const cantons = await resolveCantonsForId(regionsTable, id);
    for (const canton of cantons) {
      cantonsById.set(canton.serverId ?? canton.server_id, canton);
    }
  }

  const objects = [];
  for (const canton of cantonsById.values()) {
    const villages = await regionsTable.query(Q.where('parent_id', canton.serverId ?? canton.server_id)).fetch();
    objects.push({
      id: canton.serverId ?? canton.server_id,
      name: canton.name,
      // `parent` (id du canton) est indispensable ici : CitizenReportLocationStep/containers/
      // Content.js filtre les villages du canton sélectionné via `villages[i].parent === canton.id`.
      villages: villages.map((v) => ({ id: v.serverId ?? v.server_id, name: v.name, parent: canton.serverId ?? canton.server_id })),
    });
  }
  return objects;
};

// Profil du facilitateur (ADL) connecté. Auparavant lu directement depuis la base CouchDB
// `eadls` (appel Mango `_find` avec des identifiants `dbCredentials_*` qui n'étaient plus jamais
// renseignés depuis le passage à l'authentification JWT — cet appel était donc systématiquement
// en échec, cf. procédure de vérification de la migration WatermelonDB). Le même dictionnaire
// (forme legacy `eadl`) est désormais obtenu via `/authentication/me/` (authentication/views.py::
// MyProfileAPIView), authentifié par le token JWT courant — plus besoin de renvoyer le mot de
// passe de l'utilisateur à chaque appel (cf. l'ancien `/authentication/obtain-auth-credentials/`,
// conservé côté backend uniquement pour les installations mobiles pas encore mises à jour).
export const getUserDocs = async () => {
  const cachedDoc = await getData('userDoc');
  const cachedCommune = await getData('userCommune');

  if (cachedDoc && cachedCommune) {
    return { userDoc: cachedDoc, userCommune: cachedCommune };
  }

  let userDoc = null;
  let userCommune = null;
  let ids = [];

  const response = await new API().getMyProfile();
  userDoc = response?.eadl || null;
  if (userDoc) {
    // Attend qu'une tentative de synchronisation des niveaux administratifs se soit déroulée
    // (succès ou échec) avant de lire le cache local `administrative_regions` ci-dessous — sinon,
    // juste après le login, `resolveUserCommune`/`resolveAdministrativeRegionsObjects` peuvent
    // s'exécuter avant que `startWatermelonSync()` ait fini de peupler ce cache en arrière-plan,
    // et renvoyer des localités vides (impactait notamment CitizenReportLocationStep).
    await ensureAdministrativeLevelsSynced();
    userCommune = await resolveUserCommune(userDoc.administrative_region);
    userDoc.administrative_regions_objects = await resolveAdministrativeRegionsObjects(
      (userDoc.administrative_regions && userDoc.administrative_regions.length > 0) ? userDoc.administrative_regions : (userDoc.administrative_region ? [userDoc.administrative_region] : [])
    );
    userDoc.additional_administrative_regions_objects = await resolveAdministrativeRegionsObjects(
      (userDoc.additional_administrative_regions && userDoc.additional_administrative_regions.length > 0) ? userDoc.additional_administrative_regions : (userDoc.administrative_region ? [userDoc.administrative_region] : [])
    );
  }

  await storeData('userDoc', userDoc);
  await storeData('userCommune', userCommune);

  return { userDoc, userCommune };
};

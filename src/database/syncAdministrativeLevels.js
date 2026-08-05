import { Q } from '@nozbe/watermelondb';

import { database } from './index';
import { api } from '../api/client';

/**
 * Synchronise le cache local des niveaux administratifs (villages/cantons/préfectures/régions)
 * depuis l'endpoint dédié `/api/administrative-levels/` — séparé du protocole `pull`/`push`
 * habituel, car la base `mis` (MySQL, externe) n'a pas de suivi `updated_at` fiable pour un sync
 * incrémental (CLAUDE.md §2.1/§4.7). À appeler sur un intervalle espacé (ex. une fois par jour),
 * pas à chaque `runSync()`.
 */
export async function syncAdministrativeLevels() {
  let url = '/administrative-levels/?page_size=1000';
  const collection = database.get('administrative_regions');

  while (url) {
    const { data } = await api.get(url);

    // Une seule requête pour retrouver les enregistrements déjà présents (au lieu d'un
    // `query().fetch()` par élément, jusqu'à 1000 allers-retours SQLite séquentiels par page) puis
    // un unique `database.batch()` plutôt qu'un `database.write()` par élément : ça réduit
    // drastiquement le temps où cette page retient l'écrivain unique de WatermelonDB, qui bloquait
    // sinon les autres lecteurs/écrivains en attente (ex. `synchronize()` lancé en parallèle par
    // `runSyncSafely()`) assez longtemps pour déclencher le warning "can't be performed yet...".
    const ids = data.results.map((level) => level.id);
    const existingRecords = ids.length
      ? await collection.query(Q.where('server_id', Q.oneOf(ids))).fetch()
      : [];
    const existingByServerId = new Map(existingRecords.map((r) => [r.serverId ?? r.server_id, r]));

    const batchOps = data.results.map((level) => {
      const existing = existingByServerId.get(level.id);
      if (existing) {
        return existing.prepareUpdate((r) => {
          r.name = level.name;
          r.type = level.type;
          r.parentId = level.parent ?? null;
          r.latitude = level.latitude !== null ? Number(level.latitude) : null;
          r.longitude = level.longitude !== null ? Number(level.longitude) : null;
        });
      }
      return collection.prepareCreate((r) => {
        r._raw.id = `mis-${level.id}`; // id local stable, distinct des UUID des autres tables
        r.serverId = level.id;
        r.name = level.name;
        r.type = level.type;
        r.parentId = level.parent ?? null;
        r.latitude = level.latitude !== null ? Number(level.latitude) : null;
        r.longitude = level.longitude !== null ? Number(level.longitude) : null;
      });
    });

    if (batchOps.length) {
      // `database.batch()` doit être appelé depuis l'intérieur d'un writer (`database.write()`) —
      // contrairement à `database.write()` seul, il ne démarre pas son propre writer.
      // Un seul argument tableau plutôt qu'un spread (`...batchOps`) : avec page_size=1000, un
      // spread de 1000 arguments déclenche le warning WatermelonDB "was called with N arguments,
      // it might be a performance bug" (et risque un "Maximum call stack exceeded" avec des pages
      // encore plus grandes) — `database.batch()` accepte nativement un tableau unique.
      await database.write(async () => {
        await database.batch(batchOps);
      });
    }

    // `next` renvoyé par PageNumberPagination de DRF : URL absolue, on la réutilise telle quelle
    // pour l'appel axios suivant (axios accepte une URL absolue même avec une baseURL configurée).
    url = data.next;
  }
}

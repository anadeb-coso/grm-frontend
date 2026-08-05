import { uuidv4 } from './uuid';

/**
 * Crée un enregistrement WatermelonDB en forçant un UUID v4 comme id local, au lieu du nanoid
 * généré par défaut. Cet id est repris tel quel comme clé primaire côté Postgres lors du
 * prochain push (avec `sendCreatedAsUpdated: true`, voir database/sync.js), donc les ids
 * mobile/serveur restent cohérents sans étape de remapping après coup.
 */
export async function createWithId(collection, recordBuilder) {
  return collection.database.write(async () => {
    return collection.create((record) => {
      record._raw.id = uuidv4(); // doit être fait avant toute autre mutation du record
      recordBuilder(record);
    });
  });
}

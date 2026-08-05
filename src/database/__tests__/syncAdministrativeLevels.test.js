import 'fake-indexeddb/auto'; // requis par LokiJSAdapter (adapter de test, cf. database/index.js)

import { database } from '../index';
import { syncAdministrativeLevels } from '../syncAdministrativeLevels';
import { api } from '../../api/client';

jest.mock('../../api/client', () => ({
  api: { get: jest.fn() },
}));

describe('syncAdministrativeLevels', () => {
  afterEach(async () => {
    await database.write(async () => database.unsafeResetDatabase());
    jest.clearAllMocks();
  });

  it('crée les niveaux administratifs reçus en une seule page', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        results: [
          { id: 1, name: 'TOGO', type: 'Country', parent: null, latitude: null, longitude: null },
          { id: 2439, name: 'BONZOUKOU', type: 'Village', parent: 100, latitude: '8.5', longitude: '1.2' },
        ],
        next: null,
      },
    });

    await syncAdministrativeLevels();

    const regions = await database.get('administrative_regions').query().fetch();
    expect(regions).toHaveLength(2);
    const village = regions.find((r) => r.serverId === 2439);
    expect(village.name).toBe('BONZOUKOU');
    expect(village.parentId).toBe(100);
    expect(village.latitude).toBe(8.5);
  });

  it('met à jour les enregistrements existants au lieu de les dupliquer, et crée les nouveaux dans le même batch', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        results: [
          { id: 2439, name: 'BONZOUKOU', type: 'Village', parent: 100, latitude: null, longitude: null },
        ],
        next: null,
      },
    });
    await syncAdministrativeLevels();

    api.get.mockResolvedValueOnce({
      data: {
        results: [
          { id: 2439, name: 'BONZOUKOU (renommé)', type: 'Village', parent: 100, latitude: null, longitude: null },
          { id: 3968, name: 'AUTRE VILLAGE', type: 'Village', parent: 100, latitude: null, longitude: null },
        ],
        next: null,
      },
    });
    await syncAdministrativeLevels();

    const regions = await database.get('administrative_regions').query().fetch();
    expect(regions).toHaveLength(2); // pas de duplicat pour 2439
    const village = regions.find((r) => r.serverId === 2439);
    expect(village.name).toBe('BONZOUKOU (renommé)');
    expect(regions.some((r) => r.serverId === 3968)).toBe(true);
  });

  it('parcourt toutes les pages via `next`', async () => {
    api.get
      .mockResolvedValueOnce({
        data: { results: [{ id: 1, name: 'A', type: 'Village', parent: null, latitude: null, longitude: null }], next: '/administrative-levels/?page=2' },
      })
      .mockResolvedValueOnce({
        data: { results: [{ id: 2, name: 'B', type: 'Village', parent: null, latitude: null, longitude: null }], next: null },
      });

    await syncAdministrativeLevels();

    expect(api.get).toHaveBeenCalledTimes(2);
    const regions = await database.get('administrative_regions').query().fetch();
    expect(regions).toHaveLength(2);
  });
});

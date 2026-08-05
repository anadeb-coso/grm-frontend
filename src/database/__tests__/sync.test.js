import 'fake-indexeddb/auto'; // requis par LokiJSAdapter (adapter de test, cf. database/index.js)

import { database } from '../index';
import { runSync } from '../sync';
import { api } from '../../api/client';

jest.mock('../../api/client', () => ({
  api: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('../../files/uploadQueue', () => ({
  enqueuePendingUploads: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../utils/storageManager', () => ({
  getData: jest.fn().mockResolvedValue('test-device-id'),
  storeData: jest.fn().mockResolvedValue(undefined),
}));

describe('runSync', () => {
  afterEach(async () => {
    await database.write(async () => database.unsafeResetDatabase());
    jest.clearAllMocks();
  });

  it('crée localement une issue reçue au pull', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        force_full_resync: false,
        changes: {
          issues: {
            created: [{
              id: 'a5e1f7d0-1111-4b2a-9c3e-000000000001',
              internal_code: 'DRP-1',
              tracking_code: null,
              auto_increment_id: 1,
              description: 'Test pull',
              confirmed: true,
              source: 'mobile',
              publish: false,
              notification_send: true,
              ongoing_issue: false,
              event_recurrence: false,
              resolution_days: 0,
              created_date: '2026-01-01T00:00:00Z',
              intake_date: '2026-01-01T00:00:00Z',
              issue_date: '2026-01-01T00:00:00Z',
              status: 'status-1',
              category: 'cat-1',
              issue_type: 'type-1',
              administrative_region: 2439,
              is_deleted: false,
            }],
            updated: [],
            deleted: [],
          },
        },
        timestamp: Date.now(),
        has_more: false,
      },
    });
    api.post.mockResolvedValueOnce({});

    await runSync();

    const issues = await database.get('issues').query().fetch();
    expect(issues).toHaveLength(1);
    expect(issues[0].internalCode).toBe('DRP-1');
    expect(issues[0].administrativeRegionId).toBe(2439);
  });

  it('pousse les créations locales avec les dates converties en ISO-8601', async () => {
    const { createWithId } = require('../utils/createWithId');
    await createWithId(database.get('issues'), (issue) => {
      issue.internalCode = 'DRP-2';
      issue.description = 'Créée hors-ligne';
      issue.autoIncrementId = 2;
      issue.createdDate = new Date('2026-01-01T00:00:00.000Z').getTime();
    });

    api.get.mockResolvedValueOnce({
      data: { force_full_resync: false, changes: {}, timestamp: Date.now(), has_more: false },
    });
    api.post.mockResolvedValueOnce({});

    await runSync();

    expect(api.post).toHaveBeenCalledWith(
      '/sync/push/',
      expect.objectContaining({
        device_id: 'test-device-id',
        changes: expect.objectContaining({
          issues: expect.objectContaining({
            created: expect.arrayContaining([
              expect.objectContaining({
                internal_code: 'DRP-2',
                created_date: '2026-01-01T00:00:00.000Z',
              }),
            ]),
          }),
        }),
      }),
    );
  });

  it('vide la base locale puis relance un pull complet quand le serveur force un full resync', async () => {
    api.get
      .mockResolvedValueOnce({ data: { force_full_resync: true, changes: {}, timestamp: Date.now(), has_more: false } })
      .mockResolvedValueOnce({ data: { force_full_resync: false, changes: {}, timestamp: Date.now(), has_more: false } });
    api.post.mockResolvedValue({});

    await runSync();

    expect(api.get).toHaveBeenCalledTimes(2);
  });
});

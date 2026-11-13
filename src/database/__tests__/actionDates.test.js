import 'fake-indexeddb/auto'; // requis par LokiJSAdapter (adapter de test, cf. database/index.js)

import { database } from '../index';
import { runSync } from '../sync';
import { api } from '../../api/client';

// Dates EXACTES saisies sur le mobile (acceptation / réouverture, investigation, escalade,
// réception) : enregistrées localement puis envoyées au serveur au format ISO, et relues au pull.
jest.mock('../../api/client', () => ({
  api: { get: jest.fn(), post: jest.fn() },
  getCurrentUserId: jest.fn().mockResolvedValue(null),
}));
jest.mock('../../files/uploadQueue', () => ({
  enqueuePendingUploads: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../utils/storageManager', () => ({
  getData: jest.fn().mockResolvedValue('test-device-id'),
  storeData: jest.fn().mockResolvedValue(undefined),
}));

const EXACT = new Date('2026-11-04T00:00:00.000Z');
const EMPTY_PULL = { data: { force_full_resync: false, changes: {}, timestamp: Date.now(), has_more: false } };

describe('dates exactes des actions', () => {
  afterEach(async () => {
    await database.write(async () => database.unsafeResetDatabase());
    jest.clearAllMocks();
  });

  it('sont poussées au serveur au format ISO', async () => {
    await database.write(async () => {
      await database.get('issue_status_stories').create((r) => {
        r.issueId = 'issue-1';
        r.statusId = 'status-1';
        r.comment = 'Plainte acceptée';
        r.datetime = new Date();
        r.actionDate = EXACT;
      });
      await database.get('reasons').create((r) => {
        r.issueId = 'issue-1';
        r.subject = 'comment';
        r.comment = 'Visite du site';
        r.dueAt = new Date();
        r.actionDate = EXACT;
      });
      await database.get('escalation_levels').create((r) => {
        r.issueId = 'issue-1';
        r.administrativeLevel = 'Canton';
        r.dueAt = new Date();
        r.escalationDate = EXACT;
      });
    });
    api.get.mockResolvedValue(EMPTY_PULL);
    api.post.mockResolvedValue({ data: {} });

    await runSync();

    const pushCall = api.post.mock.calls.find(([url]) => url === '/sync/push/');
    const { changes } = pushCall[1];
    const pushed = (table) => [...changes[table].created, ...changes[table].updated][0];
    expect(pushed('issue_status_stories').action_date).toBe(EXACT.toISOString());
    expect(pushed('reasons').action_date).toBe(EXACT.toISOString());
    expect(pushed('escalation_levels').escalation_date).toBe(EXACT.toISOString());
  });

  it('sont relues au pull', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        force_full_resync: false,
        changes: {
          reasons: {
            created: [{
              id: 'reason-1', issue: 'issue-1', subject: 'comment', comment: 'Étape',
              due_at: '2026-11-10T08:00:00Z', action_date: '2026-11-04T00:00:00Z', is_deleted: false,
            }],
            updated: [],
            deleted: [],
          },
        },
        timestamp: Date.now(),
        has_more: false,
      },
    });

    await runSync();

    const [reason] = await database.get('reasons').query().fetch();
    expect(reason.actionDate.toISOString()).toBe(EXACT.toISOString());
  });
});

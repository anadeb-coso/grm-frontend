import 'fake-indexeddb/auto'; // requis par LokiJSAdapter (adapter de test, cf. database/index.js)

import { database } from '../index';
import { runSync } from '../sync';
import { api, getCurrentUserId } from '../../api/client';
import * as storage from '../../utils/storageManager';

jest.mock('../../api/client', () => ({
  api: { get: jest.fn(), post: jest.fn() },
  getCurrentUserId: jest.fn(),
}));

jest.mock('../../files/uploadQueue', () => ({
  enqueuePendingUploads: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../utils/storageManager', () => {
  const store = {};
  return {
    getData: jest.fn(async (key) => (key in store ? store[key] : null)),
    storeData: jest.fn(async (key, value) => { store[key] = value; }),
    removeValue: jest.fn(async (key) => { delete store[key]; }),
    mockStore: store,
  };
});

// Changement de compte sur un même téléphone (sync.js::prepareLocalDatabaseOwner) : la table
// `issues` est filtrée par utilisateur côté serveur, un pull incrémental ne suffit pas.
const FACILITATOR_ID = 7;
const SUPERVISOR_ID = 99;

function issueRow(id, code) {
  return {
    id, internal_code: code, tracking_code: null, auto_increment_id: 1, description: 'Test',
    confirmed: true, source: 'mobile', publish: false, notification_send: true,
    ongoing_issue: false, event_recurrence: false, resolution_days: 0,
    created_date: '2026-01-01T00:00:00Z', intake_date: '2026-01-01T00:00:00Z',
    issue_date: '2026-01-01T00:00:00Z', status: 'status-1', category: 'cat-1',
    issue_type: 'type-1', administrative_region: 2439, is_deleted: false,
  };
}

function pullResponse(issues = []) {
  return {
    data: {
      force_full_resync: false,
      changes: issues.length ? { issues: { created: [], updated: issues, deleted: [] } } : {},
      timestamp: Date.now(),
      has_more: false,
    },
  };
}

async function syncAs(userId, issues = []) {
  getCurrentUserId.mockResolvedValue(userId);
  api.get.mockResolvedValueOnce(pullResponse(issues));
  await runSync();
  return api.get.mock.calls[api.get.mock.calls.length - 1][1].params;
}

async function issueCodes() {
  return (await database.get('issues').query().fetch()).map((issue) => issue.internalCode).sort();
}

describe('changement de compte sur le même appareil', () => {
  afterEach(async () => {
    await database.write(async () => database.unsafeResetDatabase());
    Object.keys(storage.mockStore).forEach((key) => delete storage.mockStore[key]);
    jest.clearAllMocks();
    api.get.mockReset();
  });

  it("vide la base et repart d'un pull complet quand un autre compte se connecte", async () => {
    await syncAs(FACILITATOR_ID, [issueRow('a5e1f7d0-1111-4b2a-9c3e-000000000001', 'FC-1')]);
    expect(await issueCodes()).toEqual(['FC-1']);
    expect(storage.mockStore.localDatabaseOwnerId).toBe(String(FACILITATOR_ID));

    const params = await syncAs(SUPERVISOR_ID, [issueRow('a5e1f7d0-1111-4b2a-9c3e-000000000002', 'SUP-1')]);

    expect(params.last_pulled_at).toBe(0);
    expect(await issueCodes()).toEqual(['SUP-1']);
    expect(storage.mockStore.localDatabaseOwnerId).toBe(String(SUPERVISOR_ID));
  });

  it('garde la base et le pull incrémental quand le même compte se reconnecte', async () => {
    await syncAs(FACILITATOR_ID, [issueRow('a5e1f7d0-1111-4b2a-9c3e-000000000001', 'FC-1')]);

    const params = await syncAs(FACILITATOR_ID);

    expect(params.last_pulled_at).toBeGreaterThan(0);
    expect(params.full_tables || '').not.toContain('issues');
    expect(await issueCodes()).toEqual(['FC-1']);
  });

  it('redemande les plaintes en entier, sans rien vider, quand le propriétaire est inconnu', async () => {
    await syncAs(FACILITATOR_ID, [issueRow('a5e1f7d0-1111-4b2a-9c3e-000000000001', 'FC-1')]);
    delete storage.mockStore.localDatabaseOwnerId; // base synchronisée avant ce suivi

    const params = await syncAs(SUPERVISOR_ID);

    expect(params.last_pulled_at).toBeGreaterThan(0);
    expect(params.full_tables.split(',')).toEqual(expect.arrayContaining(['issues', 'phases', 'tasks']));
    expect(await issueCodes()).toEqual(['FC-1']);
    expect(storage.mockStore.localDatabaseOwnerId).toBe(String(SUPERVISOR_ID));
  });
});

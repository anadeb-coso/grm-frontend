import 'fake-indexeddb/auto'; // requis par LokiJSAdapter (adapter de test, cf. database/index.js)

import { database } from '../index';
import { clearLocalUserScopedData, runSync } from '../sync';
import { createInternetCreditConfirmation, loadInternetCreditNotifications } from '../internetCredits';
import { subscribeRejectedRecords } from '../syncEvents';
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

const CVGP_ID = 42;
const FC_ID = 7;
const NOW = '2026-09-20T10:00:00Z';
const CAMPAIGN = {
  id: 'campaign-1', period: '2026-09-01', month_label: 'Septembre 2026', sent_date: '2026-09-02',
  package_label: '3 Go valables 30 jours', amount: 3000, is_deleted: false, created_at: NOW, updated_at: NOW,
};
const LINE = {
  id: 'line-1', campaign: 'campaign-1', cvgp_member: CVGP_ID, member_name: 'Membre CVGP', phone_number: '22890000000',
  cvd_id: 7001, cvd_name: 'KPEKPE', village_names: 'Kpekpe Centre, Kpekpe Nord',
  cvgp_message: 'CVGP du CVD KPEKPE a bien reçu le crédit internet pour le mois de Septembre 2026',
  fc_message: 'FC : CVGP du CVD KPEKPE a bien reçu le crédit internet', is_deleted: false, created_at: NOW, updated_at: NOW,
};
const SIGNATURE = 'data:image/png;base64,iVBORw0KGgo=';
// Tables filtrées par utilisateur (forfait internet + notifications de commentaire), demandées en
// entier au premier pull et quand un autre compte se connecte (sync.js::prepareUserScopedTables).
const USER_SCOPED_TABLES = 'internet_credit_campaigns,internet_credit_beneficiaries,internet_credit_confirmations,issue_notifications';

function pullResponse(changes = {}) {
  return { data: { force_full_resync: false, changes, timestamp: Date.now(), has_more: false } };
}

function asUpdated(tables) {
  return Object.fromEntries(Object.entries(tables).map(([t, rows]) => [t, { created: [], updated: rows, deleted: [] }]));
}

async function receiveLine(userId) {
  getCurrentUserId.mockResolvedValue(userId);
  api.get.mockResolvedValueOnce(pullResponse(asUpdated({
    internet_credit_campaigns: [CAMPAIGN],
    internet_credit_beneficiaries: [LINE],
  })));
  await runSync();
}

describe('forfait internet CVGP (mobile MGP)', () => {
  afterEach(async () => {
    await database.write(async () => database.unsafeResetDatabase());
    Object.keys(storage.mockStore).forEach((key) => delete storage.mockStore[key]);
    jest.clearAllMocks();
    api.get.mockReset();
    api.post.mockReset();
  });

  it('affiche la notification au membre CVGP et demande les tables en entier au premier pull', async () => {
    await receiveLine(CVGP_ID);

    expect(api.get.mock.calls[0][1].params.full_tables).toBe(USER_SCOPED_TABLES);
    const notifications = await loadInternetCreditNotifications(CVGP_ID);
    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toMatchObject({ role: 'cvgp', message: LINE.cvgp_message });
    expect(notifications[0].campaign.monthLabel).toBe('Septembre 2026');

    // Même utilisateur ensuite : retour au pull incrémental.
    api.get.mockResolvedValueOnce(pullResponse());
    await runSync();
    expect(api.get.mock.calls[1][1].params.full_tables).toBeUndefined();
  });

  it('confirmation du CVGP : la notification disparaît et la confirmation part au push', async () => {
    await receiveLine(CVGP_ID);
    const [notification] = await loadInternetCreditNotifications(CVGP_ID);
    const confirmation = await createInternetCreditConfirmation({
      notification, userId: CVGP_ID, signature: SIGNATURE, description: '  Reçu le 3  ',
    });

    expect(await loadInternetCreditNotifications(CVGP_ID)).toHaveLength(0);

    api.get.mockResolvedValue(pullResponse());
    api.post.mockResolvedValue({ status: 204 });
    await runSync();

    const pushed = api.post.mock.calls[0][1].changes.internet_credit_confirmations.created;
    expect(pushed).toHaveLength(1);
    expect(pushed[0]).toMatchObject({
      id: confirmation.id, beneficiary: 'line-1', role: 'cvgp', confirmed_by: CVGP_ID, checked: true,
      signature: SIGNATURE, has_signature: true, description: 'Reçu le 3', source: 'grm_mobile',
    });
    expect(pushed[0].confirmed_at).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO-8601 pour Django
  });

  it('FC/AC : la notification reste après sa confirmation et disparaît quand le CVGP confirme', async () => {
    await receiveLine(FC_ID);
    let [notification] = await loadInternetCreditNotifications(FC_ID);
    expect(notification.role).toBe('fc');
    expect(notification.message).toBe(LINE.fc_message);

    await createInternetCreditConfirmation({ notification, userId: FC_ID, signature: SIGNATURE });
    [notification] = await loadInternetCreditNotifications(FC_ID);
    expect(notification.myConfirmation).not.toBeNull();
    expect(notification.cvgpConfirmation).toBeNull();

    // Le pull suivant apporte la confirmation du membre CVGP.
    api.post.mockResolvedValue({ status: 204 });
    api.get.mockResolvedValueOnce(pullResponse(asUpdated({
      internet_credit_confirmations: [{
        id: 'cvgp-confirmation', beneficiary: 'line-1', role: 'cvgp', confirmed_by: CVGP_ID,
        confirmed_by_name: 'Membre CVGP', message: LINE.cvgp_message, checked: true, has_signature: true,
        description: null, confirmed_at: NOW, source: 'grm_mobile', is_deleted: false, created_at: NOW, updated_at: NOW,
      }],
    })));
    api.get.mockResolvedValue(pullResponse());
    await runSync();

    expect(await loadInternetCreditNotifications(FC_ID)).toHaveLength(0);
  });

  it('une confirmation refusée par le serveur est retirée localement et la notification réapparaît', async () => {
    await receiveLine(CVGP_ID);
    const [notification] = await loadInternetCreditNotifications(CVGP_ID);
    const confirmation = await createInternetCreditConfirmation({ notification, userId: CVGP_ID, signature: SIGNATURE });
    const listener = jest.fn();
    const unsubscribe = subscribeRejectedRecords(listener);

    api.get.mockResolvedValue(pullResponse());
    api.post.mockResolvedValue({ status: 200, data: { rejected: { internet_credit_confirmations: [confirmation.id] } } });
    await runSync();
    unsubscribe();

    expect(await database.get('internet_credit_confirmations').query().fetchCount()).toBe(0);
    expect(await loadInternetCreditNotifications(CVGP_ID)).toHaveLength(1);
    expect(listener).toHaveBeenCalledWith({ internet_credit_confirmations: [confirmation.id] });
  });

  it("vide les lignes d'un autre compte et les redemande en entier quand l'utilisateur change", async () => {
    await receiveLine(FC_ID);
    expect(await database.get('internet_credit_beneficiaries').query().fetchCount()).toBe(1);

    getCurrentUserId.mockResolvedValue(99);
    api.get.mockResolvedValueOnce(pullResponse());
    await runSync();

    expect(await database.get('internet_credit_beneficiaries').query().fetchCount()).toBe(0);
    expect(api.get.mock.calls[1][1].params.full_tables).toBe(USER_SCOPED_TABLES);
    expect(storage.mockStore.internetCreditsOwnerId).toBe('99');
  });

  it('la déconnexion vide les tables et oublie le propriétaire', async () => {
    await receiveLine(CVGP_ID);
    await clearLocalUserScopedData();

    expect(await database.get('internet_credit_campaigns').query().fetchCount()).toBe(0);
    expect(storage.mockStore.internetCreditsOwnerId).toBeUndefined();
  });
});

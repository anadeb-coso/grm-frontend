import 'fake-indexeddb/auto'; // requis par LokiJSAdapter (adapter de test, cf. database/index.js)

import { database } from '../index';
import { runSync } from '../sync';
import {
  createUserComment, loadCommentNotificationGroups, loadIssueComments, loadUnreadCommentIds,
  markIssueNotificationsRead, parseEmails,
} from '../issueNotifications';
import { api } from '../../api/client';

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
  removeValue: jest.fn().mockResolvedValue(undefined),
}));

const ISSUE_ID = 'a5e1f7d0-2222-4b2a-9c3e-000000000001';
const NOW = '2026-10-02T10:00:00Z';
const empty = () => ({ created: [], updated: [], deleted: [] });

function pullResponse(changes) {
  return { data: { force_full_resync: false, changes, timestamp: Date.now(), has_more: false, cursor: null } };
}

function comment(id, text, minutes) {
  return {
    id, issue: ISSUE_ID, author: 9, author_name: 'Agent terrain', comment: text,
    due_at: `2026-10-02T10:0${minutes}:00Z`, is_deleted: false, is_user_comment: true, send_email: true,
    notify_emails: [], notify_user_ids: [], created_at: NOW, updated_at: NOW,
  };
}

function notification(id, commentId, text, readAt = null) {
  return {
    id, recipient: 5, issue: ISSUE_ID, comment: commentId, kind: 'comment', read_at: readAt,
    issue_code: 'DRP-NOTIF-1', comment_text: text, author_name: 'Agent terrain', is_deleted: false,
    created_at: NOW, updated_at: NOW,
  };
}

async function pullCommentedIssue() {
  api.get.mockResolvedValueOnce(pullResponse({
    issues: {
      created: [],
      updated: [{
        id: ISSUE_ID, internal_code: 'DRP-NOTIF-1', auto_increment_id: 1, description: 'Pont effondré',
        confirmed: true, source: 'mobile', publish: false, notification_send: true, ongoing_issue: false,
        event_recurrence: false, resolution_days: 0, created_date: NOW, intake_date: NOW, issue_date: NOW,
        status: 'status-1', category: 'cat-1', issue_type: 'type-1', administrative_region: 2439,
        is_deleted: false, created_at: NOW, updated_at: NOW,
      }],
      deleted: [],
    },
    comments: { created: [], updated: [comment('c-1', 'Premier passage', 1), comment('c-2', 'Travaux lundi', 2)], deleted: [] },
    issue_notifications: {
      created: [],
      updated: [notification('n-1', 'c-1', 'Premier passage', NOW), notification('n-2', 'c-2', 'Travaux lundi')],
      deleted: [],
    },
  }));
  await runSync();
}

describe('notifications des commentaires (mobile)', () => {
  afterEach(async () => {
    await database.write(async () => database.unsafeResetDatabase());
    jest.clearAllMocks();
  });

  it("regroupe les notifications par issue avec le nombre de commentaires et de non lus", async () => {
    await pullCommentedIssue();

    const groups = await loadCommentNotificationGroups();

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      issueId: ISSUE_ID, issueCode: 'DRP-NOTIF-1', hasIssue: true, commentsCount: 2, unreadCount: 1,
    });
    expect([...(await loadUnreadCommentIds(ISSUE_ID))]).toEqual(['c-2']);
    const comments = await loadIssueComments(ISSUE_ID);
    expect(comments.map((c) => c.text)).toEqual(['Travaux lundi', 'Premier passage']);
  });

  it('marque les notifications lues et envoie la lecture au serveur au push suivant', async () => {
    await pullCommentedIssue();

    expect(await markIssueNotificationsRead(ISSUE_ID)).toBe(1);
    expect((await loadCommentNotificationGroups())[0].unreadCount).toBe(0);

    api.get.mockResolvedValue(pullResponse({ issue_notifications: empty() }));
    api.post.mockResolvedValueOnce({ status: 204, data: '' });
    await runSync();

    const pushed = api.post.mock.calls.find((c) => c[0] === '/sync/push/')[1].changes;
    const readNotifications = pushed.issue_notifications.updated;
    expect(readNotifications.map((n) => n.id)).toEqual(['n-2']);
    expect(typeof readNotifications[0].read_at).toBe('string'); // ISO-8601 attendu par Django
  });

  it('pousse un commentaire écrit avec ses options de notification', async () => {
    await pullCommentedIssue();
    jest.clearAllMocks();

    await createUserComment({
      issueId: ISSUE_ID,
      text: 'Visite demain',
      author: { id: 5, name: 'Facilitateur' },
      sendEmail: true,
      notifyEmails: ['partenaire@example.org'],
      notifyUserIds: [12, 13],
    });
    api.get.mockResolvedValue(pullResponse({}));
    api.post.mockResolvedValueOnce({ status: 204, data: '' });
    await runSync();

    const pushed = api.post.mock.calls.find((c) => c[0] === '/sync/push/')[1].changes;
    // Créé localement : part dans `created` (le serveur traite `created` et `updated` à l'identique).
    const [record] = [...pushed.comments.created, ...pushed.comments.updated];
    expect(record).toMatchObject({
      issue: ISSUE_ID, comment: 'Visite demain', author: 5, is_user_comment: true, send_email: true,
      notify_emails: ['partenaire@example.org'], notify_user_ids: [12, 13],
    });
  });

  it('découpe et valide les adresses email saisies', () => {
    expect(parseEmails('A@x.org; b@y.com, pas-une-adresse  a@x.org')).toEqual({
      valid: ['a@x.org', 'b@y.com'],
      invalid: ['pas-une-adresse'],
    });
  });
});

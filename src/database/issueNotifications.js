import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';

import { database } from './index';
import { createWithId } from './utils/createWithId';
import { api } from '../api/client';
import { getData, storeData } from '../utils/storageManager';

const NOTIFICATION_ACCOUNTS_KEY = 'notificationAccounts';
const OBSERVED_TABLES = ['issue_notifications', 'comments', 'issues'];
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

async function findOrNull(table, id) {
  if (!id) return null;
  try {
    return await database.get(table).find(id);
  } catch (err) {
    return null;
  }
}

/**
 * Notifications « nouveau commentaire » du compte connecté, regroupées par issue (la plus récente
 * d'abord) : nombre de commentaires de l'issue et nombre de commentaires non lus. Le serveur ne
 * synchronise que les notifications dont ce compte est destinataire (grm-backend/src/sync/views.py).
 */
export async function loadCommentNotificationGroups() {
  const notifications = await database.get('issue_notifications')
    .query(Q.where('is_deleted', false), Q.where('kind', 'comment'))
    .fetch();

  const groups = new Map();
  notifications.forEach((notification) => {
    const group = groups.get(notification.issueId) || {
      issueId: notification.issueId,
      issueCode: notification.issueCode,
      notificationsCount: 0,
      unreadCount: 0,
      last: null,
    };
    group.notificationsCount += 1;
    if (!notification.readAt) group.unreadCount += 1;
    if (!group.last || (notification.createdAt?.getTime() || 0) > (group.last.createdAt?.getTime() || 0)) {
      group.last = notification;
    }
    groups.set(notification.issueId, group);
  });

  const result = await Promise.all([...groups.values()].map(async (group) => {
    const [issue, commentsCount] = await Promise.all([
      findOrNull('issues', group.issueId),
      database.get('comments').query(Q.where('issue', group.issueId), Q.where('is_deleted', false)).fetchCount(),
    ]);
    return {
      issueId: group.issueId,
      issueCode: issue?.internalCode || group.issueCode,
      hasIssue: !!issue,
      commentsCount: Math.max(commentsCount, group.notificationsCount),
      unreadCount: group.unreadCount,
      lastAuthorName: group.last?.authorName,
      lastCommentText: group.last?.commentText,
      lastAt: group.last?.createdAt,
    };
  }));
  return result.sort((a, b) => (b.lastAt?.getTime() || 0) - (a.lastAt?.getTime() || 0));
}

/** Liste observée : se met à jour à chaque pull, nouveau commentaire ou lecture. */
export function useCommentNotifications() {
  const [state, setState] = useState({ loading: true, items: [] });

  useEffect(() => {
    let active = true;
    const reload = async () => {
      try {
        const items = await loadCommentNotificationGroups();
        if (active) setState({ loading: false, items });
      } catch (err) {
        if (__DEV__) console.warn('[issueNotifications] chargement des notifications impossible', err);
        if (active) setState((s) => ({ ...s, loading: false }));
      }
    };
    reload();
    const subscription = database.withChangesForTables(OBSERVED_TABLES).subscribe(() => reload());
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}

/** Identifiants des commentaires de l'issue encore non lus par le compte connecté. */
export async function loadUnreadCommentIds(issueId) {
  const unread = await database.get('issue_notifications')
    .query(Q.where('issue', issueId), Q.where('read_at', null), Q.where('is_deleted', false))
    .fetch();
  return new Set(unread.map((n) => n.commentId).filter(Boolean));
}

/** Marque comme lues les notifications de l'issue ; la lecture part au serveur au prochain push. */
export async function markIssueNotificationsRead(issueId) {
  const unread = await database.get('issue_notifications')
    .query(Q.where('issue', issueId), Q.where('read_at', null), Q.where('is_deleted', false))
    .fetch();
  if (!unread.length) return 0;
  const now = new Date();
  await database.write(async () => {
    await database.batch(...unread.map((n) => n.prepareUpdate((record) => { record.readAt = now; })));
  });
  return unread.length;
}

/**
 * Commentaires d'une issue, du plus récent au plus ancien. Si l'issue n'est pas synchronisée sur
 * l'appareil (compte ajouté à la main hors de son périmètre), on se rabat sur le texte copié dans
 * les notifications reçues.
 */
export async function loadIssueComments(issueId) {
  const comments = await database.get('comments')
    .query(Q.where('issue', issueId), Q.where('is_deleted', false))
    .fetch();
  if (comments.length) {
    return comments
      .map((c) => ({ id: c.id, authorName: c.authorName, text: c.comment, at: c.dueAt || c.createdAt }))
      .sort((a, b) => (b.at?.getTime() || 0) - (a.at?.getTime() || 0));
  }
  const notifications = await database.get('issue_notifications')
    .query(Q.where('issue', issueId), Q.where('is_deleted', false))
    .fetch();
  return notifications
    .map((n) => ({ id: n.commentId || n.id, authorName: n.authorName, text: n.commentText, at: n.createdAt }))
    .sort((a, b) => (b.at?.getTime() || 0) - (a.at?.getTime() || 0));
}

/**
 * Découpe une saisie libre d'adresses email (séparées par virgules, points-virgules ou espaces) :
 * `{ valid, invalid }`, sans doublon, en minuscules.
 */
export function parseEmails(text) {
  const valid = [];
  const invalid = [];
  (text || '').split(/[,;\s]+/).map((e) => e.trim().toLowerCase()).filter(Boolean).forEach((email) => {
    if (!EMAIL_RE.test(email)) invalid.push(email);
    else if (!valid.includes(email)) valid.push(email);
  });
  return { valid, invalid };
}

/**
 * Commentaire écrit par l'utilisateur, avec ses options de notification : le serveur notifie les
 * membres de l'issue, les comptes et adresses ajoutés ici, et envoie l'email si `sendEmail`
 * (grm-backend/src/issue/notifications.py). Enregistré localement, il part au prochain push.
 */
export async function createUserComment({ issueId, text, author, sendEmail, notifyEmails, notifyUserIds }) {
  return createWithId(database.get('comments'), (c) => {
    c.issueId = issueId;
    c.authorId = author?.id ?? null;
    c.authorName = author?.name ?? null;
    c.comment = text;
    c.dueAt = new Date();
    c.isUserComment = true;
    c.sendEmail = !!sendEmail;
    c.notifyEmails = notifyEmails || [];
    c.notifyUserIds = notifyUserIds || [];
  });
}

/**
 * Comptes que l'auteur d'un commentaire peut ajouter aux destinataires. Mis en cache pour pouvoir
 * commenter hors-ligne : en cas d'échec réseau, on renvoie la dernière liste connue.
 */
export async function fetchNotificationAccounts() {
  try {
    const { data } = await api.get('/notification-accounts/');
    if (Array.isArray(data)) {
      await storeData(NOTIFICATION_ACCOUNTS_KEY, data);
      return data;
    }
  } catch (err) {
    // hors-ligne ou serveur indisponible : liste en cache ci-dessous
  }
  return (await getData(NOTIFICATION_ACCOUNTS_KEY)) || [];
}

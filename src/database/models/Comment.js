import { Model } from '@nozbe/watermelondb';
import { field, date, json, relation, readonly } from '@nozbe/watermelondb/decorators';

const sanitizeList = (value) => (Array.isArray(value) ? value : []);

export default class Comment extends Model {
  static table = 'comments';

  static associations = {
    issues: { type: 'belongs_to', key: 'issue' },
  };

  @field('issue') issueId;
  @field('author') authorId;
  @field('author_name') authorName;
  @field('comment') comment;
  @field('is_deleted') isDeleted;
  // Commentaire écrit par un utilisateur (zone « Commentaires ») et ses options de notification —
  // les commentaires ajoutés automatiquement par les actions n'ont pas `is_user_comment`.
  @field('is_user_comment') isUserComment;
  @field('send_email') sendEmail;
  @json('notify_emails', sanitizeList) notifyEmails;
  @json('notify_user_ids', sanitizeList) notifyUserIds;

  @date('due_at') dueAt;

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;

  @relation('issues', 'issue') issue;
}

import { Model } from '@nozbe/watermelondb';
import { date, field, readonly, relation } from '@nozbe/watermelondb/decorators';

/** Notification « nouveau commentaire » du compte connecté (cf. database/issueNotifications.js). */
export default class IssueNotification extends Model {
  static table = 'issue_notifications';

  static associations = {
    issues: { type: 'belongs_to', key: 'issue' },
    comments: { type: 'belongs_to', key: 'comment' },
  };

  @field('recipient') recipientId;
  @field('issue') issueId;
  @field('comment') commentId;
  @field('kind') kind;
  @date('read_at') readAt;
  @field('issue_code') issueCode;
  @field('comment_text') commentText;
  @field('author_name') authorName;
  @field('is_deleted') isDeleted;

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;

  @relation('issues', 'issue') issue;
  @relation('comments', 'comment') comment;
}

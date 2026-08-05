import { Model } from '@nozbe/watermelondb';
import { field, date, relation, readonly } from '@nozbe/watermelondb/decorators';

export default class Reason extends Model {
  static table = 'reasons';

  static associations = {
    issues: { type: 'belongs_to', key: 'issue' },
    attachments: { type: 'belongs_to', key: 'attachment' },
  };

  @field('issue') issueId;
  @field('subject') subject;
  @field('comment') comment;
  @field('user') userId;
  @field('user_name') userName;
  @field('attachment') attachmentId;
  @field('is_deleted') isDeleted;

  @date('due_at') dueAt;

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;

  @relation('issues', 'issue') issue;
  @relation('attachments', 'attachment') attachment;
}

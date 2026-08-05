import { Model } from '@nozbe/watermelondb';
import { field, date, relation, readonly } from '@nozbe/watermelondb/decorators';

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

  @date('due_at') dueAt;

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;

  @relation('issues', 'issue') issue;
}

import { Model } from '@nozbe/watermelondb';
import { field, date, relation, readonly } from '@nozbe/watermelondb/decorators';

export default class IssueStatusStory extends Model {
  static table = 'issue_status_stories';

  static associations = {
    issues: { type: 'belongs_to', key: 'issue' },
    issue_statuses: { type: 'belongs_to', key: 'status' },
  };

  @field('issue') issueId;
  @field('status') statusId;
  @field('user') userId;
  @field('user_full_name') userFullName;
  @field('comment') comment;
  @field('is_deleted') isDeleted;

  @date('datetime') datetime;

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;

  @relation('issues', 'issue') issue;
  @relation('issue_statuses', 'status') status;
}

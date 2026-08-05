import { Model } from '@nozbe/watermelondb';
import { field, date, relation, readonly } from '@nozbe/watermelondb/decorators';

export default class EscalationLevel extends Model {
  static table = 'escalation_levels';

  static associations = {
    issues: { type: 'belongs_to', key: 'issue' },
  };

  @field('issue') issueId;
  @field('administrative_level') administrativeLevel;
  @field('administrative_id') administrativeId;
  @field('name') name;
  @field('is_deleted') isDeleted;

  @date('due_at') dueAt;

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;

  @relation('issues', 'issue') issue;
}

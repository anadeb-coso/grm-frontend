import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export default class IssueDepartment extends Model {
  static table = 'issue_departments';

  @field('legacy_id') legacyId;
  @field('name') name;
  @field('head_name') headName;
  @field('is_deleted') isDeleted;

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;
}

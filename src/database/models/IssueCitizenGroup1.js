import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export default class IssueCitizenGroup1 extends Model {
  static table = 'issue_citizen_groups_1';

  @field('legacy_id') legacyId;
  @field('name') name;
  @field('is_deleted') isDeleted;

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;
}

import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export default class IssueCitizenGroup2 extends Model {
  static table = 'issue_citizen_groups_2';

  @field('legacy_id') legacyId;
  @field('name') name;
  @field('is_deleted') isDeleted;

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;
}

import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export default class IssueAgeGroup extends Model {
  static table = 'issue_age_groups';

  @field('legacy_id') legacyId;
  @field('name') name;
  @field('is_deleted') isDeleted;

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;
}

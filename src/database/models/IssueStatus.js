import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export default class IssueStatus extends Model {
  static table = 'issue_statuses';

  @field('legacy_id') legacyId;
  @field('name') name;
  @field('final_status') finalStatus;
  @field('initial_status') initialStatus;
  @field('rejected_status') rejectedStatus;
  @field('open_status') openStatus;
  @field('unresolved_status') unresolvedStatus;
  @field('eligible_status') eligibleStatus;
  @field('not_eligible_status') notEligibleStatus;
  @field('is_deleted') isDeleted;

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;
}

import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, json } from '@nozbe/watermelondb/decorators';

const sanitizeJson = (json) => json;

export default class IssueCategory extends Model {
  static table = 'issue_categories';

  @field('legacy_id') legacyId;
  @field('name') name;
  @field('label') label;
  @field('abbreviation') abbreviation;
  @field('confidentiality_level') confidentialityLevel;
  @field('redirection_protocol') redirectionProtocol;
  @field('administrative_level') administrativeLevel;
  @field('is_deleted') isDeleted;

  @json('assigned_department', sanitizeJson) assignedDepartment;
  @json('assigned_appeal_department', sanitizeJson) assignedAppealDepartment;
  @json('assigned_escalation_department', sanitizeJson) assignedEscalationDepartment;

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;
}

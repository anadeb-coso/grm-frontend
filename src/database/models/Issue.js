import { Model } from '@nozbe/watermelondb';
import { field, date, children, relation, json, readonly } from '@nozbe/watermelondb/decorators';

const sanitizeJson = (json) => json;

export default class Issue extends Model {
  static table = 'issues';

  static associations = {
    comments: { type: 'has_many', foreignKey: 'issue' },
    issue_status_stories: { type: 'has_many', foreignKey: 'issue' },
    reasons: { type: 'has_many', foreignKey: 'issue' },
    attachments: { type: 'has_many', foreignKey: 'issue' },
    escalation_reasons: { type: 'has_many', foreignKey: 'issue' },
    escalation_levels: { type: 'has_many', foreignKey: 'issue' },
  };

  @field('internal_code') internalCode;
  @field('tracking_code') trackingCode;
  @field('auto_increment_id') autoIncrementId;
  @field('description') description;
  @field('confirmed') confirmed;
  @field('citizen') citizen;
  @field('contact_medium') contactMedium;
  @field('citizen_type') citizenType;
  @field('citizen_group_1') citizenGroup1;
  @field('citizen_group_2') citizenGroup2;
  @field('citizen_or_group') citizenOrGroup;
  @field('source') source;
  @field('publish') publish;
  @field('notification_send') notificationSend;
  @field('ongoing_issue') ongoingIssue;
  @field('event_recurrence') eventRecurrence;
  @field('resolution_days') resolutionDays;
  @field('research_result') researchResult;

  @field('status') statusId;
  @field('category') categoryId;
  @field('age_group') ageGroupId;
  @field('issue_type') issueTypeId;
  @field('assignee') assigneeId;
  @field('assignee_name') assigneeName;
  @field('reporter') reporterId;
  @field('reporter_name') reporterName;
  @field('administrative_region') administrativeRegionId;
  @field('administrative_region_name') administrativeRegionName;

  @json('location_info', sanitizeJson) locationInfo;
  @json('structure_in_charge', sanitizeJson) structureInCharge;
  @json('contact_information', sanitizeJson) contactInformation;
  @json('commune', sanitizeJson) commune;

  @field('is_deleted') isDeleted;
  @field('escalate_flag') escalateFlag;

  @date('publish_date') publishDate;
  @date('created_date') createdDate;
  @date('intake_date') intakeDate;
  @date('issue_date') issueDate;
  @date('resolution_date') resolutionDate;
  @date('reject_date') rejectDate;

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;

  @children('comments') comments;
  @children('issue_status_stories') statusStories;
  @children('reasons') reasons;
  @children('attachments') attachments;
  @children('escalation_reasons') escalationReasons;
  @children('escalation_levels') escalationLevels;

  @relation('issue_statuses', 'status') status;
  @relation('issue_categories', 'category') category;
  @relation('issue_age_groups', 'age_group') ageGroup;
  @relation('issue_types', 'issue_type') issueType;
}

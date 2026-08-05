import { Model } from '@nozbe/watermelondb';
import { field, date, children, relation, json, readonly } from '@nozbe/watermelondb/decorators';

const sanitizeJson = (json) => json;

export default class Task extends Model {
  static table = 'tasks';

  static TYPE_MULTIPLE_LIST_ACTIVITY = 'multiple_list_activity';
  static TYPE_VOTE_ACTIVITY = 'vote_activity';
  static TYPE_INPUT_ACTIVITY = 'input_activity';
  static TYPE_DOCUMENT = 'document';

  static STATUS_NOT_STARTED = 'not-started';
  static STATUS_IN_PROGRESS = 'in-progress';
  static STATUS_COMPLETED = 'completed';

  static associations = {
    phases: { type: 'belongs_to', key: 'phase' },
    attachments: { type: 'has_many', foreignKey: 'task' },
  };

  @field('phase') phaseId;
  @field('ordinal') ordinal;
  @field('task_type') taskType;
  @field('title') title;
  @field('description') description;
  @field('status') status;
  @field('notes') notes;
  @field('bp_amount') bpAmount;
  @field('is_deleted') isDeleted;

  @json('location', sanitizeJson) location;

  @date('open_at') openAt;
  @date('due_at') dueAt;
  @date('closed_at') closedAt;

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;

  @relation('phases', 'phase') phase;
  @children('attachments') attachments;
}

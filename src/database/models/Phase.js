import { Model } from '@nozbe/watermelondb';
import { field, date, children, relation, readonly } from '@nozbe/watermelondb/decorators';

export default class Phase extends Model {
  static table = 'phases';

  static associations = {
    adls: { type: 'belongs_to', key: 'adl' },
    tasks: { type: 'has_many', foreignKey: 'phase' },
  };

  @field('adl') adlId;
  @field('ordinal') ordinal;
  @field('title') title;
  @field('is_deleted') isDeleted;

  @date('open_at') openAt;
  @date('due_at') dueAt;
  @date('closed_at') closedAt;

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;

  @relation('adls', 'adl') adl;
  @children('tasks') tasks;
}

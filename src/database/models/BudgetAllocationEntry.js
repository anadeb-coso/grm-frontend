import { Model } from '@nozbe/watermelondb';
import { field, date, relation, readonly } from '@nozbe/watermelondb/decorators';

export default class BudgetAllocationEntry extends Model {
  static table = 'budget_allocations';

  static associations = {
    bp_projects: { type: 'belongs_to', key: 'bp_project' },
  };

  @field('bp_project') bpProjectId;
  @field('description') description;
  @field('amount') amount;
  @field('is_deleted') isDeleted;

  @date('entry_date') entryDate;

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;

  @relation('bp_projects', 'bp_project') bpProject;
}

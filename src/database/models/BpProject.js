import { Model } from '@nozbe/watermelondb';
import { field, date, children, relation, readonly } from '@nozbe/watermelondb/decorators';

export default class BpProject extends Model {
  static table = 'bp_projects';

  static associations = {
    adls: { type: 'belongs_to', key: 'adl' },
    budget_allocations: { type: 'has_many', foreignKey: 'bp_project' },
  };

  @field('adl') adlId;
  @field('external_code') externalCode;
  @field('district_name') districtName;
  @field('subproject_name') subprojectName;
  @field('subproject_description') subprojectDescription;
  @field('vote_ym') voteYm;
  @field('vote_yf') voteYf;
  @field('vote_mm') voteMm;
  @field('vote_mf') voteMf;
  @field('vote_om') voteOm;
  @field('vote_of') voteOf;
  @field('is_deleted') isDeleted;

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;

  @relation('adls', 'adl') adl;
  @children('budget_allocations') budgetAllocations;
}

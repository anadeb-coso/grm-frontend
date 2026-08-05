import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, json, children } from '@nozbe/watermelondb/decorators';

const sanitizeJson = (json) => json;

export default class Adl extends Model {
  static table = 'adls';

  static associations = {
    phases: { type: 'has_many', foreignKey: 'adl' },
    bp_projects: { type: 'has_many', foreignKey: 'adl' },
  };

  @field('legacy_couch_id') legacyCouchId;
  @field('name') name;
  @field('location_name') locationName;
  @field('representative') representativeId;
  @field('representative_name') representativeName;
  @field('department') department;
  @field('is_deleted') isDeleted;

  @json('administrative_region_ids', sanitizeJson) administrativeRegionIds;
  @json('additional_administrative_region_ids', sanitizeJson) additionalAdministrativeRegionIds;

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;

  @children('phases') phases;
  @children('bp_projects') bpProjects;
}

import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

/** Délai de traitement d'une plainte à un niveau (lecture seule, cf. schema.js v8). */
export default class ProcessingDelay extends Model {
  static table = 'processing_delays';

  @field('level') level;
  @field('committee_name') committeeName;
  @field('delay_days') delayDays;
  @field('working_days') workingDays;
  @field('is_deleted') isDeleted;

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;
}

import { Model } from '@nozbe/watermelondb';
import { field, date, children, readonly } from '@nozbe/watermelondb/decorators';

/** Forfait internet mensuel CVGP (lecture seule, reçu au pull). */
export default class InternetCreditCampaign extends Model {
  static table = 'internet_credit_campaigns';

  static associations = {
    internet_credit_beneficiaries: { type: 'has_many', foreignKey: 'campaign' },
  };

  @date('period') period;
  @field('month_label') monthLabel;
  @date('sent_date') sentDate;
  @field('package_label') packageLabel;
  @field('amount') amount;
  @field('is_deleted') isDeleted;

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;

  @children('internet_credit_beneficiaries') beneficiaries;
}

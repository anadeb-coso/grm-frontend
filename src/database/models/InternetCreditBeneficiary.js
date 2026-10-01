import { Model } from '@nozbe/watermelondb';
import { field, date, children, relation, readonly } from '@nozbe/watermelondb/decorators';

/** Ligne d'un membre CVGP (= un CVD) pour un forfait mensuel (lecture seule, reçue au pull). */
export default class InternetCreditBeneficiary extends Model {
  static table = 'internet_credit_beneficiaries';

  static associations = {
    internet_credit_campaigns: { type: 'belongs_to', key: 'campaign' },
    internet_credit_confirmations: { type: 'has_many', foreignKey: 'beneficiary' },
  };

  @field('campaign') campaignId;
  @field('cvgp_member') cvgpMemberId;
  @field('member_name') memberName;
  @field('phone_number') phoneNumber;
  @field('cvd_id') cvdId;
  @field('cvd_name') cvdName;
  @field('village_names') villageNames;
  @field('cvgp_message') cvgpMessage;
  @field('fc_message') fcMessage;
  @field('is_deleted') isDeleted;

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;

  @relation('internet_credit_campaigns', 'campaign') campaign;
  @children('internet_credit_confirmations') confirmations;
}

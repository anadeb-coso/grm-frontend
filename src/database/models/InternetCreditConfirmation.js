import { Model } from '@nozbe/watermelondb';
import { field, date, relation, readonly } from '@nozbe/watermelondb/decorators';

/** Confirmation signée de réception du forfait (créée sur le mobile, poussée au serveur). */
export default class InternetCreditConfirmation extends Model {
  static table = 'internet_credit_confirmations';

  static associations = {
    internet_credit_beneficiaries: { type: 'belongs_to', key: 'beneficiary' },
  };

  @field('beneficiary') beneficiaryId;
  @field('role') role;
  @field('confirmed_by') confirmedById;
  @field('confirmed_by_name') confirmedByName;
  @field('message') message;
  @field('checked') checked;
  @field('signature') signature;
  @field('has_signature') hasSignature;
  @field('description') description;
  @field('source') source;
  @field('is_deleted') isDeleted;

  @date('confirmed_at') confirmedAt;

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;

  @relation('internet_credit_beneficiaries', 'beneficiary') beneficiary;
}

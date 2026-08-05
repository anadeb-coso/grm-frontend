import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

// Table de cache local uniquement (jamais synchronisée via runSync()/pull-push) — alimentée par
// syncAdministrativeLevels() sur un intervalle séparé et plus espacé (CLAUDE.md §2.1/§4.7).
export default class AdministrativeRegion extends Model {
  static table = 'administrative_regions';

  @field('server_id') serverId;
  @field('name') name;
  @field('type') type;
  @field('parent_id') parentId;
  @field('latitude') latitude;
  @field('longitude') longitude;

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;
}

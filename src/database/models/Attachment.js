import { Model } from '@nozbe/watermelondb';
import { field, relation, readonly, date } from '@nozbe/watermelondb/decorators';

export default class Attachment extends Model {
  static table = 'attachments';

  static associations = {
    issues: { type: 'belongs_to', key: 'issue' },
    tasks: { type: 'belongs_to', key: 'task' },
  };

  @field('issue') issueId;
  @field('task') taskId;
  @field('file_name') fileName;
  @field('content_type') contentType;
  @field('remote_url') remoteUrl;
  @field('local_uri') localUri;
  @field('upload_status') uploadStatus;
  @field('download_status') downloadStatus;
  @field('size') size;
  @field('is_deleted') isDeleted;

  @relation('issues', 'issue') issue;
  @relation('tasks', 'task') task;

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;
}

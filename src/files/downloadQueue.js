import * as FileSystem from 'expo-file-system';

import { database } from '../database';
import { getTokens } from '../api/client';

export async function downloadAttachment(attachment) {
  const tokens = await getTokens();
  const localPath = `${FileSystem.documentDirectory}${attachment.fileName}`;
  await FileSystem.downloadAsync((attachment.remoteUrl ?? "")?.split('?')[0], localPath
  // ,
  // {
  //   headers: tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {},
  // }
);
  return localPath;
}

/**
 * Téléchargement à la demande d'UNE pièce jointe, déclenché explicitement par l'utilisateur (icône
 * de téléchargement dans l'UI) — il n'y a plus de balayage automatique de toutes les pièces
 * jointes en attente à chaque synchronisation (cf. suppression de l'appel dans
 * database/sync.js::runSync) : sur un réseau limité, l'app ne doit pas rapatrier en arrière-plan
 * des dizaines de photos/PDF/audio simplement parce qu'elle vient d'être ouverte. L'affichage
 * (IssueDetail/containers/Content.js) retombe directement sur `remote_url` tant que rien n'a été
 * téléchargé — voir aussi AttachmentViewerModal, qui affiche l'image/le PDF à la volée sans
 * nécessiter ce téléchargement.
 */
export async function downloadAttachmentById(attachmentId) {
  const attachment = await database.get('attachments').find(attachmentId);
  if (attachment.localUri) {
    return attachment.localUri; // déjà présent sur l'appareil
  }
  if (!attachment.remoteUrl) {
    throw new Error(`Attachment ${attachmentId} has no remote_url to download from`);
  }

  await database.write(async () => {
    await attachment.update((a) => { a.downloadStatus = 'downloading'; });
  });

  try {
    const localPath = await downloadAttachment(attachment);
    const localUri = `file://${localPath}`;
    await database.write(async () => {
      await attachment.update((a) => {
        a.localUri = localUri;
        a.downloadStatus = 'done';
      });
    });
    return localUri;
  } catch (err) {
    await database.write(async () => {
      await attachment.update((a) => { a.downloadStatus = 'error'; });
    });
    throw err;
  }
}

import * as FileSystem from 'expo-file-system';
import { Q } from '@nozbe/watermelondb';
import { Toast } from 'react-native-toast-notifications';

import { database } from '../database';
import { grmBaseURL } from '../services/env';
import { api, getTokens, refreshAccessToken } from '../api/client';
import { compressIfNeeded, getFileSize, assertUploadableSize } from './compression';
import i18n from '../translations/i18n';

/** Un seul essai d'upload multipart, avec le token d'accès actuellement stocké. */
async function uploadAttachmentFile(attachment, compressedUri) {
  const tokens = await getTokens();
  return FileSystem.uploadAsync(
    `${grmBaseURL}/api/attachments/`,
    compressedUri,
    {
      fieldName: 'file',
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      mimeType: attachment.contentType,
      parameters: {
        id: attachment.id,
        issue_id: attachment.issueId || '',
        task_id: attachment.taskId || '',
      },
      headers: tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {},
    },
  );
}

/**
 * Pousse vers le serveur les pièces jointes pas encore envoyées (`upload_status !== 'done'`) —
 * flux HTTP multipart classique, séparé du protocole `pull`/`push` (CLAUDE.md §3.7), réutilisant
 * le pattern déjà en place dans SyncAttachments.js (`expo-file-system.uploadAsync`), mais
 * authentifié par JWT plutôt que par les identifiants CouchDB.
 *
 * Inclut volontairement `'error'` et `'uploading'` en plus de `'pending'` : sans ça, une pièce
 * jointe dont un envoi précédent a échoué (`upload_status: 'error'`) ou est resté bloqué
 * `'uploading'` (ex. app tuée en plein envoi) n'était plus jamais reprise — le bouton
 * "synchroniser" de SyncAttachments.js listait ces fichiers comme non envoyés (il interroge déjà
 * `Q.notEq('done')`) mais ne les retentait jamais, laissant l'utilisateur bloqué sans recours.
 *
 * `notifyOnError` (true par défaut) affiche un toast générique dès qu'au moins une pièce jointe
 * échoue, pour prévenir l'utilisateur que l'envoi n'a pas pu se faire et que l'app réessaiera
 * plus tard (ou qu'il peut le faire lui-même dans "Synchronisation des fichiers") — avant ce
 * correctif, un échec d'upload en tâche de fond (sync périodique, retour réseau) restait
 * totalement silencieux côté UI, seul un `console.warn` en sortait. Les appelants qui affichent
 * déjà leur propre message d'erreur dédié (SyncAttachments.js, CitizenReportStep3) passent
 * `{ notifyOnError: false }` pour ne pas doubler la notification.
 */
export async function enqueuePendingUploads({ notifyOnError = true } = {}) {
  const attachmentsCollection = database.get('attachments');
  const pending = await attachmentsCollection.query(Q.where('upload_status', Q.notEq('done'))).fetch();
  let failedCount = 0;

  for (const attachment of pending) {
    try {
      await database.write(async () => {
        await attachment.update((a) => { a.uploadStatus = 'uploading'; });
      });

      const compressedUri = await compressIfNeeded(
        attachment.localUri, attachment.contentType, attachment.size,
      );
      const finalSize = await getFileSize(compressedUri);
      assertUploadableSize(finalSize);

      let response = await uploadAttachmentFile(attachment, compressedUri);

      if (response.status === 401) {
        // Ce flux passe par `expo-file-system.uploadAsync`, donc en dehors d'axios : pas
        // d'intercepteur pour rafraîchir automatiquement un access token expiré (30 min de durée
        // de vie côté Django) comme le font `pull`/`push` (cf. api/client.js). Sans ce retry, tout
        // upload tenté après expiration échouait définitivement en 401 ("token_not_valid") jusqu'à
        // la prochaine ouverture de l'app — alors que le refresh token (14 jours) était toujours
        // valide et qu'un simple rafraîchissement aurait suffi.
        await refreshAccessToken();
        response = await uploadAttachmentFile(attachment, compressedUri);
      }

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Upload failed with status ${response.status}: ${response.body}`);
      }
      const data = JSON.parse(response.body);

      await database.write(async () => {
        await attachment.update((a) => {
          a.remoteUrl = data.url;
          a.uploadStatus = 'done';
          a.size = finalSize;
          // Le fichier est désormais en sécurité côté serveur (récupérable via `remoteUrl`) :
          // on libère la copie locale pour ne pas dupliquer indéfiniment photos/audio/PDF sur le
          // téléphone. Tout affichage doit donc retomber sur `remoteUrl`/`url` quand `localUri`/
          // `local_url` est absent (cf. IssueDetail/DocumentTask containers/Content.js).
          a.localUri = null;
          // Marque explicitement "pas de re-téléchargement nécessaire" pour ce fichier — le
          // téléchargement n'est de toute façon plus automatique (cf. files/downloadQueue.js::
          // downloadAttachmentById, uniquement à la demande depuis l'UI), mais ce sentinel évite
          // qu'un futur balayage automatique ne retélécharge inutilement ce qu'on vient tout
          // juste de libérer.
          a.downloadStatus = 'done';
        });
      });
    } catch (err) {
      await database.write(async () => {
        if(attachment.localUri == null){
          await attachment.update((a) => { a.uploadStatus = 'done'; });
        }else{
          await attachment.update((a) => { a.uploadStatus = 'error'; });
          failedCount += 1;
        }
      });
      console.warn('Upload failed for', attachment.fileName, err);
    }
  }

  if (failedCount > 0 && notifyOnError) {
    Toast?.show(i18n.t('attachments_upload_failed_retry_hint'), { type: 'danger', duration: 5000 });
  }
}

/**
 * Répercute côté serveur la suppression locale d'une pièce jointe (bouton "retirer ce fichier",
 * cf. IssueActions/CitizenReportStep3/DocumentTask/RegisterSubprojects "onAttachmentRemove") —
 * `attachments` est exclue de `SYNC_WRITABLE_MODELS` (cf. grm-backend/src/sync/views.py), donc un
 * simple `record.markAsDeleted()` local ne remonte JAMAIS au serveur via le protocole `pull`/
 * `push` habituel : la suppression reste muette côté serveur (le fichier n'est jamais purgé, et
 * les AUTRES appareils ayant déjà téléchargé ce fichier ne l'apprennent jamais). Utilise le flux
 * HTTP dédié (symétrique de l'upload, `AttachmentUploadView`/`AttachmentDeleteView`), pas le
 * protocole de sync JSON.
 *
 * Appeler AVANT `record.markAsDeleted()` : une fois l'enregistrement local supprimé (et sa
 * suppression poussée au prochain sync, silencieusement ignorée côté serveur puisque `attachments`
 * n'est pas une table inscriptible du protocole), il n'y a plus moyen de retrouver l'id serveur à
 * supprimer.
 *
 * Ne fait rien si le fichier n'a jamais été envoyé (`uploadStatus !== 'done'`) : rien n'existe
 * côté serveur à supprimer. Best-effort : si l'appel échoue (hors-ligne, serveur indisponible), la
 * suppression locale se poursuit quand même — le fichier restera orphelin côté serveur jusqu'à ce
 * qu'un nettoyage manuel ou une nouvelle tentative (non automatisée pour l'instant) le retire.
 */
export async function deleteAttachmentRemote(attachment) {
  if (!attachment?.id || attachment.uploadStatus !== 'done') return;
  try {
    await api.delete(`/attachments/${attachment.id}/`);
  } catch (err) {
    console.warn('Failed to delete attachment remotely', attachment.id, err);
  }
}

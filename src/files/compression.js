import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { getImageDimensions, image_compress } from '../utils/functions';

const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15 Mo, marge sous la limite serveur (MAX_ATTACHMENT_SIZE)

/**
 * Compresse une image avant upload — réutilise la logique déjà en place dans
 * IssueActions/containers/Content.js::get_image_manipulate, extraite ici pour être partagée par
 * la file d'upload (uploadQueue.js) sans dépendre d'un écran particulier.
 */
export async function compressIfNeeded(localUri, contentType, size, width, height) {
  if (size && size < 1 * 1024 * 1024) {
    // Déjà petit (ex: PDF signé, petit fichier) : pas la peine de compresser.
    return localUri;
  }

  try {
    if (contentType?.startsWith('image/')) {
      if (!height || !width) {
        const dimensions = await getImageDimensions(localUri);
        width = dimensions.width ?? width;
        height = dimensions.height ?? height;
      }

      const result = await ImageManipulator.manipulateAsync(
        localUri,
        width || height ? [{ resize: { width, height } }] : [],
        { compress: image_compress(size / (1024 * 1024)) },
      );
      return result.uri;
    }
    // L'audio (notes vocales) est déjà compact côté enregistrement (expo-av) : envoyé tel quel.
  } catch (err) {
    console.warn('Compression échouée, envoi du fichier original', err);
  }

  return localUri;
}

export async function getFileSize(localUri) {
  const info = await FileSystem.getInfoAsync(localUri);
  return info.exists ? info.size : 0;
}

export function assertUploadableSize(size) {
  if (size > MAX_SIZE_BYTES) {
    throw new Error(
      `Fichier trop volumineux (${Math.round(size / 1024 / 1024)} Mo) après compression, ` +
      `limite ${MAX_SIZE_BYTES / 1024 / 1024} Mo`
    );
  }
}

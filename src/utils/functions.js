import * as Linking from 'expo-linking';
import { Buffer } from "buffer";
import * as FileSystem from 'expo-file-system';
// import * as Sharing from "expo-sharing";
import RNFS from 'react-native-fs';
import { getInfoAsync } from 'expo-file-system';
import { grmBaseURL } from '../services/env';
import Share from 'react-native-share';
import * as mime from 'react-native-mime-types';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { Platform, ToastAndroid, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Audio } from 'expo-av';


const padStart = (nbr) => {
    return String(nbr).padStart(2, '0');
}

export const formatDuration = (seconds) => {
    // `seconds` peut être `undefined`/`NaN` quand la durée n'a pas pu être déterminée (ex. audio
    // distant momentanément inaccessible, cf. getAudioDuration ci-dessous) — sans cette garde,
    // l'affichage montrait littéralement "NaN:NaN" plutôt qu'un état neutre.
    if (!Number.isFinite(seconds)) {
        return '--:--';
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours && hours > 0) {
        return `${padStart(hours)}:${padStart(minutes)}:${padStart(remainingSeconds)}`;
    }
    return `${padStart(minutes)}:${padStart(remainingSeconds)}`;
}

export function validatePassword(password) {
    // Vérifier si le mot de passe contient uniquement des lettres et des chiffres
    if (!/^[A-Za-z0-9]+$/.test(password)) {
        return "Le mot de passe ne doit contenir que des lettres et des chiffres.";
    }

    // Vérifier la longueur (au moins 8 caractères)
    if (password.length < 8) {
        return "Le mot de passe doit contenir au moins 8 caractères.";
    }

    // Vérifier si le mot de passe contient au moins une lettre
    if (!/[A-Za-z]/.test(password)) {
        return "Le mot de passe doit contenir au moins une lettre.";
    }

    // Vérifier si le mot de passe contient au moins un chiffre
    if (!/[0-9]/.test(password)) {
        return "Le mot de passe doit contenir au moins un chiffre.";
    }


    return true;
}


export const openUrl = url => {
    if (!url.includes("http")) {
        url = grmBaseURL + url;
    }
    Linking.openURL(url);
};

export const showDoc = async (attach, username = null, password = null, share = true) => {
    
    let url = (attach.local_url ? (attach.local_url && attach.local_url != "" ? attach.local_url : undefined) : undefined) ?? (attach.url ?? attach.uri);
    
    if (url.includes("file://")) {
        try{
            if(await getInfoAsync(attachments[k]?.local_url).exists){
                const buff = Buffer.from(url, "base64");
                const base64 = buff.toString("base64");

                let name = url.split('/')[url.split('/').length - 1];
                // if(url.includes('.pdf')){
                //     // const fileUri = FileSystem.documentDirectory + `${encodeURI(attach.name ? attach.name : "pdf")}.pdf`;
                // }else{
                //     const fileUri = FileSystem.documentDirectory + `${encodeURI(attach.name ? attach.name : "pdf")}.pdf`;
                // }

                const fileUri = FileSystem.documentDirectory + `${encodeURI(name)}`;

                await FileSystem.writeAsStringAsync(fileUri, base64, {
                    encoding: FileSystem.EncodingType.Base64,
                });

                // Sharing.shareAsync(url);
                
                await Share.open({ url: url, });
            }else{
                ToastAndroid.show(`We can't find this file`, ToastAndroid.SHORT);
            }
        }catch(e){
            //
        }
          
    } else {
        if (!url.includes("http")) {
            url = grmBaseURL + url;
        }
        try {
            // let mimeType = await getFileType(url);
            // if (mimeType && mimeType.includes("image")) {
            //     console.log('url.split("?")[0]');
            //     console.log(url.split("?")[0]);
            //     return url.split("?")[0];
            // }
            // // else if (mimeType && !mimeType.includes("pdf")) {
            //     return await download(url.split("?")[0], username, password);
            // // }
            url = await download(url.split("?")[0], username, password, share);

            return url;
        } catch (e) {
            openUrl(url.split("?")[0]);
        }

    }

    return null;

}


export const getFileType = async (url, username, password) => {
    const filename = url.split('/').pop();
    const mimeTypeFromExt = mime.lookup(filename);

    if (mimeTypeFromExt) return mimeTypeFromExt;

    // Si extension inconnue, tente HEAD
    const base64Creds = btoa(`${username}:${password}`);
    const res = await fetch(url, {
        method: 'HEAD',
        headers: {
            Authorization: `Basic ${base64Creds}`,
            username: username,
            password: password,
        }
    });

    return res.headers.get('Content-Type');
};


export const download = async (url, username = null, password = null, share=true) => {

    const base64Creds = btoa(`${username}:${password}`);

    const localPath = RNFS.DocumentDirectoryPath + '/' + url.split('/')[url.split('/').length - 1];
    const tmp = await getInfoAsync(localPath);

    if (tmp.exists) {
        return localPath;
    }

    const res = await fetch(url, {
        headers: {
            Authorization: `Basic ${base64Creds}`,
            username: username,
            password: password,
        },
    });

    const buffer = await res.arrayBuffer();
    await RNFS.writeFile(localPath, Buffer.from(buffer).toString('base64'), 'base64');

    // console.log('Download completed, file size:', (await RNFS.stat(localPath)).size);

    if (share) {
        await Share.open({
            url: `file://${localPath}`
        });
    }

    return localPath;
};



export const downloadToDownloadsFolder = async (url, username, password, progressCallback = null) => {
    try {
        if (!url.includes("http")) {
            url = grmBaseURL + url;
        }

        const base64Creds = btoa(`${username}:${password}`);

        const url_split = url.split("?")[0].split("/");
        const filename = url_split[url_split.length - 1];

        const dirs = ReactNativeBlobUtil.fs.dirs; // Chemin vers le dossier "Downloads" (Android) ou "Documents" (iOS)

        // Android: utilise le dossier Downloads
        // iOS: utilise le dossier Documents (car iOS n'autorise pas l'accès direct à Downloads)

        const downloadDir = Platform.OS === 'android' ? dirs.DownloadDir : dirs.DocumentDir;

        const path = `${downloadDir}/${filename}`;

        const fileExists = await ReactNativeBlobUtil.fs.exists(path);
        
        if (!fileExists) {
            // console.log("Téléchargement vers:", path);

            // Télécharge le fichier
            const res = await ReactNativeBlobUtil.config({
                fileCache: true,
                path,
                addAndroidDownloads: {
                    useDownloadManager: true, // Utilise le gestionnaire de téléchargement Android (notification + stockage visible)
                    notification: true,
                    title: `Téléchargement de ${filename}`,
                    description: "Fichier en cours de téléchargement...",
                    mime: await getFileType(filename, username, password), // (Optionnel) Définir le type MIME (ex: 'application/pdf')
                },
            }).fetch('GET', url, {
                Authorization: `Basic ${base64Creds}`,
                username: username,
                password: password,
            }).progress((received, total) => {
                const progress = received / total;
                // console.log(`Progression: ${(progress * 100).toFixed(2)}%`);
                if (progressCallback) {
                    progressCallback(progress);
                }
            });

            // console.log("Fichier téléchargé avec succès:", path);
            return path;
        }

    } catch (error) {
        console.error("Erreur de téléchargement:", error);
        if (progressCallback) {
            progressCallback(-1); // Signal d'erreur
        }
        // throw error;
    }
    return null;
};

const getMimeType = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
        case 'pdf': return 'application/pdf';
        case 'jpg': case 'jpeg': return 'image/jpeg';
        case 'png': return 'image/png';
        case 'mp3': return 'audio/mpeg';
        case 'mp4': return 'video/mp4';
        case 'doc': return 'application/msword';
        case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case 'xls': return 'application/vnd.ms-excel';
        case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        default: return 'application/octet-stream';
    }
};

export const getImageSize = async (imageUri) => {
  let fileSizeInMB = 0;
  try {
    const fileInfo = await FileSystem.getInfoAsync(imageUri);

    if (fileInfo.exists && fileInfo.size) {
      fileSizeInMB = fileInfo.size / (1024 * 1024); // Convert bytes to MB
    }
  } catch (error) {
    console.error('Error getting image size:', error);
  }

  return fileSizeInMB;
};


export const image_compress = (size) => {
    let result;

    if (size <= 0.5) {
        result = 1;
    } else if (size <= 1.5) {
        result = 0.9;
    } else if (size <= 2) {
        result = 0.8;
    } else if (size <= 3) {
        result = 0.7;
    } else if (size <= 4) {
        result = 0.5;
    } else if (size <= 5) {
        result = 0.45;
    } else {
        result = 0.4;
    }

    return result;
}

export const getImageDimensions = async (imageUri) => {
    return new Promise((resolve, reject) => {
        Image.getSize(
        imageUri,
        (width, height) => {
            resolve({ width, height });
        },
        (error) => {
            reject(error);
        }
        );
    });
};

export const getAudioDuration = async (sound_url) => {
    const soundObject = new Audio.Sound();
    let durationSecond;
    try {
    // Les URLs S3 distantes (`attachment.remoteUrl`) portent une signature de courte durée (1h,
    // générée côté Django au moment de l'upload, cf. AWS_QUERYSTRING_EXPIRE par défaut) qui a très
    // souvent expiré au moment où cette fonction tourne (ex. relecture d'une plainte plus tard) —
    // S3 répond alors 403 "Request has expired" pour CETTE signature précise, même quand l'objet
    // reste accessible sans signature (le bucket accepte déjà les accès anonymes non signés :
    // même correctif déjà appliqué à files/downloadQueue.js et à la vue Django
    // attachments.GetAttachmentAPIView, qui strippent toutes deux la query string avant l'accès).
    const url = (sound_url ?? '').split('?')[0];
    const { sound, status } = await Audio.Sound.createAsync(
        { uri: url }
    );

    await sound.unloadAsync();

      // Convert the duration from milliseconds to seconds
      durationSecond = status.durationMillis / 1000;
    } catch (error) {
      console.error('Error loading audio:', error);
    } finally {
      // Unload the sound object to free up resources
      await soundObject.unloadAsync();
    }
    return durationSecond;
  };
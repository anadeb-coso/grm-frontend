import * as Linking from 'expo-linking';
import { Buffer } from "buffer";
import * as FileSystem from 'expo-file-system';
// import * as Sharing from "expo-sharing";
import RNFS from 'react-native-fs';
import { getInfoAsync } from 'expo-file-system';
import { couchDBURLBase } from './databaseManager';
import Share from 'react-native-share';
import * as mime from 'react-native-mime-types';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { Platform, ToastAndroid } from 'react-native';
import { useTranslation } from 'react-i18next';


const padStart = (nbr) => {
    return String(nbr).padStart(2, '0');
}

export const formatDuration = (seconds) => {
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
        url = couchDBURLBase + url;
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
            url = couchDBURLBase + url;
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
            url = couchDBURLBase + url;
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
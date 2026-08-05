import React, { useState, useEffect } from 'react';
import { Snackbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import { View, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { EXPO_PUBLIC_ANDROID_VERSION_CODE, EXPO_PUBLIC_PACKAGE, EXPO_PUBLIC_CDD_PLAYSTORE_URL } from '../../services/env';
import StoreProjectsAPI from '../../services/storeapp/storeprojects';
import AppUpdateProgressModal from '../AppUpdateProgressModal/AppUpdateProgressModal';


let height = Dimensions.get('window').height;
let width = Dimensions.get('window').width;
const DURATION_INDEFINITE = Number.MAX_SAFE_INTEGER;

// Emplacement local du téléchargement — `cacheDirectory` plutôt que `documentDirectory` : ce
// fichier n'a besoin de survivre que le temps de l'installation, jamais réutilisé ensuite (un
// nouveau téléchargement écrase simplement l'ancien à chaque nouvelle mise à jour disponible).
const APK_LOCAL_URI = `${FileSystem.cacheDirectory}grm-update.apk`;

function SnackBarCheckAppVersionComponent() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [errorVisible, setErrorVisible] = React.useState(false);
  const [errorMessage, setErrorMessage] = useState(t('new_version_alert_message'));
  const [storeProject, setStoreProject] = useState(null);

  // Pilotage de la page plein écran de téléchargement/installation (AppUpdateProgressModal) :
  // `downloadPhase` vaut 'downloading' (barre de progression déterminée par `downloadProgress`,
  // 0 à 1), 'installing' (téléchargement terminé, l'intent d'installation Android est sur le
  // point de s'ouvrir), ou 'error' (échec réseau ou d'installation — bouton "Réessayer").
  const [downloadVisible, setDownloadVisible] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadPhase, setDownloadPhase] = useState('downloading');


  const onDismissSnackBar = () => setErrorVisible(false);


  const get_storeProjects = async () => {
    try {
      await new StoreProjectsAPI()
        .get_storeproject_by_package(EXPO_PUBLIC_PACKAGE)
        .then(async (response) => {
          if (response.error) {
            return;
          }

          if (response && response.app && response.app.version_code > EXPO_PUBLIC_ANDROID_VERSION_CODE) {
            setStoreProject(response);
            setErrorMessage(t('new_version_alert_message'));
            setErrorVisible(true);
          }
        })
        .catch(error => {
          console.error(error);
        });

    } catch (e) {
      console.log("Error1 : " + e);
    }


  };

  useEffect(() => {
    get_storeProjects();
  }, []);

  // Télécharge l'APK avec suivi de progression, puis lance directement l'intent d'installation
  // Android une fois le téléchargement terminé — remplace l'ancien `Linking.openURL(...)` qui se
  // contentait d'ouvrir l'URL dans le navigateur, laissant l'utilisateur télécharger puis ouvrir
  // manuellement le fichier depuis ses téléchargements pour lancer l'installation lui-même.
  //
  // `expo-intent-launcher`/`FileSystem.getContentUriAsync` sont spécifiques à Android (l'APK
  // sideloadé n'a pas d'équivalent iOS, où les mises à jour passent exclusivement par l'App
  // Store) : sur les autres plateformes, on retombe sur l'ancien comportement (ouvrir l'URL).
  const downloadAndInstallUpdate = async () => {
    const apkUrl = storeProject?.app?.apk_aws_s3_url;
    if (!apkUrl) return;

    if (Platform.OS !== 'android') {
      Linking.openURL(apkUrl.split('?')[0]);
      return;
    }

    setDownloadPhase('downloading');
    setDownloadProgress(0);
    setDownloadVisible(true);

    try {
      const downloadResumable = FileSystem.createDownloadResumable(
        apkUrl.split('?')[0],
        APK_LOCAL_URI,
        {},
        ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
          if (totalBytesExpectedToWrite > 0) {
            setDownloadProgress(totalBytesWritten / totalBytesExpectedToWrite);
          }
        },
      );

      const result = await downloadResumable.downloadAsync();
      if (!result?.uri) {
        throw new Error('APK download did not return a local file');
      }

      setDownloadProgress(1);
      setDownloadPhase('installing');

      // Android >= 7 (API 24) exige une `content://` URI (pas `file://`) pour ouvrir un fichier
      // depuis une autre application — `getContentUriAsync` s'appuie sur le `FileProvider` déjà
      // enregistré nativement par `expo-file-system`, pas besoin d'en configurer un séparément.
      const contentUri = await FileSystem.getContentUriAsync(result.uri);
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION — laisse l'installeur système lire le fichier
        type: 'application/vnd.android.package-archive',
      });

      // L'intent d'installation Android prend la main par-dessus l'application (l'utilisateur y
      // confirme l'installation) : on referme cette page plein écran, elle n'a plus lieu d'être
      // au premier plan pendant ce temps.
      setDownloadVisible(false);
      setErrorVisible(false);
    } catch (err) {
      console.warn('APK download/install failed', err);
      setDownloadPhase('error');
    }
  };


  return (
    <>
      <Snackbar visible={errorVisible}
        //duration={10000} onDismiss={onDismissSnackBar}
        duration={DURATION_INDEFINITE} onDismiss={() => {}}
        style={{ backgroundColor: '#e1461c', height: height }}>
        <View style={{ flexDirection: 'row', marginVertical: "auto", marginTop: height/2 }}>
          <View style={{ flex: 0.8 }}>
            <Text style={{color: 'white'}}>{errorMessage}</Text>
          </View>
          {storeProject && storeProject.app && storeProject.app.apk_aws_s3_url && <View style={{
            flex: 0.2, alignContent: 'flex-end',
            // flexDirection: 'column'
          }}>
            <TouchableOpacity onPress={downloadAndInstallUpdate}>
              <Text style={{color: 'white'}} textAlign={'right'}>{t('update_download_button')}</Text>
            </TouchableOpacity>
          </View>}
        </View>
      </Snackbar>

      <AppUpdateProgressModal
        visible={downloadVisible}
        progress={downloadProgress}
        phase={downloadPhase}
        onRetry={downloadAndInstallUpdate}
        onClose={() => setDownloadVisible(false)}
      />
    </>
  );
}

export default SnackBarCheckAppVersionComponent;

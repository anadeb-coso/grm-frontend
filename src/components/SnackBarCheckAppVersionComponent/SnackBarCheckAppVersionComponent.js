import React, { useState, useEffect } from 'react';
import { Snackbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import { View, TouchableOpacity, Dimensions, Platform, Modal, StyleSheet } from 'react-native';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Q } from '@nozbe/watermelondb';
import { hasUnsyncedChanges } from '@nozbe/watermelondb/sync';

import { EXPO_PUBLIC_ANDROID_VERSION_CODE, EXPO_PUBLIC_PACKAGE, EXPO_PUBLIC_CDD_PLAYSTORE_URL } from '../../services/env';
import StoreProjectsAPI from '../../services/storeapp/storeprojects';
import { database } from '../../database';
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

  // Boutons « Synchroniser » : la notification (Modal natif, au-dessus de tout l'écran) est
  // masquée le temps d'aller sur une page de synchronisation, pour que l'utilisateur puisse
  // envoyer ses données/fichiers avant une installation qui exigerait de désinstaller
  // l'application. Elle réapparaît dès qu'il revient sur cet écran ou change d'onglet : la mise
  // à jour reste imposée.
  const [awayForSync, setAwayForSync] = useState(false);
  // Ce qui serait perdu en cas de désinstallation : `{ datas, files }`, null tant qu'inconnu.
  const [unsynced, setUnsynced] = useState(null);
  const promptVisible = errorVisible && !awayForSync;


  const onDismissSnackBar = () => setErrorVisible(false);

  const refreshUnsynced = async () => {
    try {
      const [datas, files] = await Promise.all([
        hasUnsyncedChanges({ database }),
        database.get('attachments').query(Q.where('upload_status', Q.notEq('done'))).fetchCount(),
      ]);
      setUnsynced({ datas, files });
    } catch (e) {
      setUnsynced(null);
    }
  };

  const goToSync = (screen) => {
    setAwayForSync(true);
    navigation.navigate(screen);
  };

  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => setAwayForSync(false));
    // Onglet « Dashboard » quitté depuis une page de synchronisation : la notification revient
    // par-dessus le nouvel onglet au lieu de laisser l'application utilisable sans mise à jour.
    const unsubscribeTabBlur = navigation.getParent()?.addListener('blur', () => setAwayForSync(false));
    return () => {
      unsubscribeFocus();
      unsubscribeTabBlur?.();
    };
  }, [navigation]);

  useEffect(() => {
    if (promptVisible) refreshUnsynced();
  }, [promptVisible]);

  let unsyncedLabel = null;
  if (unsynced) {
    unsyncedLabel = !unsynced.datas && !unsynced.files
      ? t('update_everything_synced')
      : [
        unsynced.datas && t('update_unsynced_datas'),
        unsynced.files > 0 && t('update_unsynced_files', { n: unsynced.files }),
      ].filter(Boolean).join('\n');
  }


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
      {/* `Snackbar` (react-native-paper) n'est, malgré le style `height`/`backgroundColor` qui la
      fait ressembler à une page pleine, qu'une vue positionnée normalement dans l'arbre — elle
      n'intercepte les touchers que sur ses propres limites internes, pas sur tout l'écran. Un
      appui en dehors du texte/bouton "traversait" donc jusqu'aux éléments de l'écran affiché en
      dessous (ex. Home) et les déclenchait. `Modal` (natif) garantit, lui, la capture de TOUS les
      toucher de l'écran tant qu'il est visible — même pattern déjà utilisé par LoadingScreen/
      AppUpdateProgressModal. `onRequestClose` neutralisé : cette notification doit être fermée en
      appuyant sur "Mettre à jour", pas en la contournant via le bouton retour Android. */}
      <Modal visible={promptVisible} transparent animationType="fade" onRequestClose={() => {}}>
        <Snackbar visible={promptVisible}
          //duration={10000} onDismiss={onDismissSnackBar}
          duration={DURATION_INDEFINITE} onDismiss={() => {}}
          style={{ backgroundColor: '#e1461c', height: height }}>
          <View style={{ marginTop: height / 4 }}>
            <Text style={{color: 'white'}}>{errorMessage}</Text>
            <Text style={[styles.text, { marginTop: 16 }]}>{t('update_sync_first_hint')}</Text>
            {unsyncedLabel && <Text style={[styles.text, styles.bold, { marginTop: 8 }]}>{unsyncedLabel}</Text>}

            <View style={styles.syncButtons}>
              <TouchableOpacity style={[styles.outlineButton, { marginRight: 8 }]} onPress={() => goToSync('SyncDatas')}>
                <Text style={[styles.text, styles.bold]}>{t('sync_datas')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.outlineButton} onPress={() => goToSync('SyncAttachments')}>
                <Text style={[styles.text, styles.bold]}>{t('sync_files')}</Text>
              </TouchableOpacity>
            </View>

            {storeProject && storeProject.app && storeProject.app.apk_aws_s3_url && (
              <TouchableOpacity style={styles.updateButton} onPress={downloadAndInstallUpdate}>
                <Text style={styles.updateButtonText}>{t('update_download_button')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </Snackbar>
      </Modal>

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

const styles = StyleSheet.create({
  text: { color: 'white' },
  bold: { fontWeight: 'bold' },
  syncButtons: { flexDirection: 'row', marginTop: 16 },
  outlineButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 7,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  updateButton: {
    backgroundColor: 'white',
    borderRadius: 7,
    paddingVertical: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  updateButtonText: { color: '#e1461c', fontWeight: 'bold' },
});

export default SnackBarCheckAppVersionComponent;

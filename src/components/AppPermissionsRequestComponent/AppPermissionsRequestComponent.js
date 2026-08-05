import { useEffect } from 'react';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import { useTranslation } from 'react-i18next';

import { EXPO_PUBLIC_PACKAGE } from '../../services/env';
import { getData, storeData } from '../../utils/storageManager';

// Ne demande ces autorisations qu'une seule fois par installation (pas à chaque ouverture de
// l'accueil) — que l'utilisateur les accorde ou les refuse, on respecte son choix plutôt que de
// le relancer sans arrêt. Changer cette clé (ex. si de nouvelles autorisations s'ajoutent plus
// tard) permet de redéclencher le flux pour tout le monde.
const ASKED_STORAGE_KEY = 'appPermissionsRequestedV1';

// "Installer des applications inconnues" et "Affichage par-dessus les autres applications" sont
// des autorisations "spéciales" côté Android (depuis l'API 26) : contrairement à la caméra/au
// stockage, il n'existe aucune boîte de dialogue système à demander par programmation — seul
// l'utilisateur peut les activer manuellement, depuis un écran de Paramètres dédié à CETTE
// application. On ne peut donc pas non plus vérifier par avance si elles sont déjà accordées ;
// on se contente d'expliquer pourquoi elles sont utiles puis d'ouvrir l'écran correspondant.
async function openInstallUnknownAppsSettings() {
  if (Platform.OS !== 'android') return;
  try {
    if (Platform.Version >= 26) {
      await IntentLauncher.startActivityAsync(
        'android.settings.MANAGE_UNKNOWN_APP_SOURCES',
        { data: `package:${EXPO_PUBLIC_PACKAGE}` },
      );
    } else {
      // Avant l'API 26, il s'agit d'un simple interrupteur global (Sécurité > Sources inconnues),
      // pas d'un réglage par application.
      await IntentLauncher.startActivityAsync('android.settings.SECURITY_SETTINGS');
    }
  } catch (err) {
    console.warn('Unable to open "install unknown apps" settings', err);
  }
}

async function openOverlaySettings() {
  if (Platform.OS !== 'android') return;
  try {
    await IntentLauncher.startActivityAsync(
      'android.settings.action.MANAGE_OVERLAY_PERMISSION',
      { data: `package:${EXPO_PUBLIC_PACKAGE}` },
    );
  } catch (err) {
    console.warn('Unable to open "display over other apps" settings', err);
  }
}

async function requestStoragePermission() {
  if (Platform.OS !== 'android') return;
  try {
    // Android 13+ (API 33) a remplacé READ/WRITE_EXTERNAL_STORAGE par des permissions média
    // granulaires — demander l'ancien couple n'y déclenche plus aucune boîte de dialogue (l'OS
    // les considère accordées sans effet réel) et `WRITE_EXTERNAL_STORAGE` n'a même plus d'effet.
    const permissions = Platform.Version >= 33
      ? [
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
      ]
      : [
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      ];
    await PermissionsAndroid.requestMultiple(permissions);
  } catch (err) {
    console.warn('Storage permission request failed', err);
  }
}

/**
 * Demande, une seule fois au premier lancement (accueil de l'application), les trois
 * autorisations Android nécessaires au flux de mise à jour auto-installée (cf.
 * SnackBarCheckAppVersionComponent/AppUpdateProgressModal) et à l'usage général de fichiers :
 * stockage/média, installation d'applications inconnues (pour poser l'APK téléchargé), et
 * affichage par-dessus les autres applications. Ne rend rien à l'écran — orchestre uniquement des
 * boîtes de dialogue système/natives.
 */
function AppPermissionsRequestComponent() {
  const { t } = useTranslation();

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    (async () => {
      const alreadyAsked = await getData(ASKED_STORAGE_KEY);
      if (alreadyAsked) return;

      await requestStoragePermission();

      await new Promise((resolve) => {
        Alert.alert(
          t('permission_install_unknown_apps_title'),
          t('permission_install_unknown_apps_message'),
          [
            { text: t('cancel'), style: 'cancel', onPress: resolve },
            { text: t('open_settings'), onPress: () => openInstallUnknownAppsSettings().finally(resolve) },
          ],
          { cancelable: true, onDismiss: resolve },
        );
      });

      await new Promise((resolve) => {
        Alert.alert(
          t('permission_overlay_title'),
          t('permission_overlay_message'),
          [
            { text: t('cancel'), style: 'cancel', onPress: resolve },
            { text: t('open_settings'), onPress: () => openOverlaySettings().finally(resolve) },
          ],
          { cancelable: true, onDismiss: resolve },
        );
      });

      await storeData(ASKED_STORAGE_KEY, true);
    })();
  }, [t]);

  return null;
}

export default AppPermissionsRequestComponent;

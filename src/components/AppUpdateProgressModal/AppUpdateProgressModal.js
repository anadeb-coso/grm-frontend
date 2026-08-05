import React from 'react';
import { Image, Modal, StyleSheet, View } from 'react-native';
import { Button, ProgressBar, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { colors } from '../../utils/colors';

/**
 * Page plein écran affichée pendant le téléchargement (et l'installation) de la mise à jour APK
 * — remplace l'ancien comportement de `SnackBarCheckAppVersionComponent` (`Linking.openURL` vers
 * le store, qui se contentait d'ouvrir le navigateur puis laissait l'utilisateur installer
 * manuellement le fichier téléchargé).
 *
 * `onRequestClose` (bouton retour Android) est un no-op tant que `phase` vaut `'downloading'`/
 * `'installing'` — un `Modal` React Native intercepte nativement le bouton retour au lieu de
 * quitter/fermer, pas besoin d'un `BackHandler` séparé — pour éviter qu'un aller-retour
 * accidentel n'interrompe le téléchargement. En cas d'erreur, retour et bouton "Fermer"
 * permettent tous les deux de quitter cette page (l'utilisateur peut retenter plus tard depuis le
 * bandeau de notification, resté affiché en dessous).
 *
 * `phase` : `'downloading'` (barre de progression déterminée par `progress`, 0 à 1),
 * `'installing'` (téléchargement terminé, l'intent d'installation Android va s'ouvrir par-dessus
 * cet écran), ou `'error'` (échec du téléchargement OU de l'installation — boutons "Réessayer"/
 * "Fermer").
 */
function AppUpdateProgressModal({ visible, progress, phase, onRetry, onClose }) {
  const { t } = useTranslation();

  if (!visible) return null;

  const canClose = phase === 'error';

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={canClose ? onClose : () => {}}
    >
      <View style={styles.container}>
        <Image
          source={require('../../../assets/icon.png')}
          style={styles.image}
          resizeMode="contain"
        />
        <Text style={styles.title}>
          {phase === 'installing'
            ? t('update_installing_message')
            : phase === 'error'
              ? t('update_download_error')
              : t('update_downloading_title')}
        </Text>

        {phase === 'downloading' && (
          <>
            <Text style={styles.message}>{t('update_downloading_message')}</Text>
            <ProgressBar
              progress={progress}
              color={colors.primary}
              style={styles.progressBar}
            />
            <Text style={styles.percentage}>{Math.round((progress || 0) * 100)}%</Text>
          </>
        )}

        {phase === 'error' && (
          <View style={styles.errorActions}>
            <Button
              mode="outlined"
              onPress={onClose}
              textColor={colors.primary}
              style={styles.closeButton}
            >
              {t('cancel')}
            </Button>
            <Button
              mode="contained"
              onPress={onRetry}
              buttonColor={colors.primary}
              textColor="white"
              style={styles.retryButton}
            >
              {t('retry')}
            </Button>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  image: {
    width: 140,
    height: 140,
    marginBottom: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    color: '#707070',
    marginBottom: 24,
  },
  progressBar: {
    width: '100%',
    height: 10,
    borderRadius: 6,
  },
  percentage: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  errorActions: {
    flexDirection: 'row',
    marginTop: 24,
  },
  closeButton: {
    marginRight: 12,
    borderColor: colors.primary,
  },
  retryButton: {},
});

export default AppUpdateProgressModal;

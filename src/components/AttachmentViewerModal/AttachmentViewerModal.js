import React, { useState } from 'react';
import { Modal, View, Image, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import Pdf from 'react-native-pdf';
import { colors } from '../../utils/colors';

/**
 * Visionneuse plein écran (image ou PDF) pour une pièce jointe — ouverte depuis l'icône "voir en
 * grand" des écrans GRM (preuve de résolution, décisions/investigations, pièces jointes de
 * l'issue). Affiche directement `uri` (locale si déjà téléchargée, sinon distante) : contrairement
 * à l'ancien comportement (partage/ouverture externe via `Share`/`Linking`), ceci ne nécessite
 * plus de téléchargement préalable — `Image`/`Pdf` chargent une URL distante à la volée.
 */
function AttachmentViewerModal({ visible, onClose, uri, isPdf, title, onShare, onDownload, isLocal }) {
  const { t } = useTranslation();
  const [pdfError, setPdfError] = useState(false);

  return (
    <Modal visible={!!visible} transparent={false} animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton icon="close" iconColor="#fff" size={26} onPress={onClose} />
          <Text style={styles.title} numberOfLines={1}>{title || ''}</Text>
          {!isLocal && !!onDownload && (
            <IconButton icon="download" iconColor="#fff" size={24} onPress={onDownload} />
          )}
          {!!onShare && (
            <IconButton icon="share-variant" iconColor="#fff" size={22} onPress={onShare} />
          )}
        </View>

        <View style={styles.body}>
          {!uri ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : isPdf ? (
            pdfError ? (
              <Text style={styles.errorText}>{t('file_read_error')}</Text>
            ) : (
              <Pdf
                source={{ uri, cache: false }}
                style={styles.pdf}
                onError={() => setPdfError(true)}
                renderActivityIndicator={() => <ActivityIndicator color={colors.primary} size="large" />}
              />
            )
          ) : (
            <Image source={{ uri }} style={styles.image} resizeMode="contain" />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  title: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  pdf: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  errorText: {
    color: '#fff',
  },
});

export default AttachmentViewerModal;

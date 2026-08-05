import React, { useState, useEffect, useCallback } from 'react';
import { View, Modal, Text, ScrollView, RefreshControl } from 'react-native';
import { ActivityIndicator, Snackbar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../../database';
import { enqueuePendingUploads } from '../../../files/uploadQueue';
import { colors } from '../../../utils/colors';
import ImagesList from './components/ImagesList';
import CustomGreenButton from '../../../components/CustomGreenButton/CustomGreenButton';
import SyncImage from '../../../../assets/sync-image.svg';
import CheckCircle from '../../../../assets/check-circle.svg';

function SyncAttachments({ navigation }) {
  const { t } = useTranslation();

  const FILE_READ_ERROR = t('file_read_error');
  const FILE_READ_ERROR_TRY_AGAIN = t('file_read_error_try_again');

  const [loading, setLoading] = useState(true);
  const [attachments, setAttachments] = useState([]);
  const [successModal, setSuccessModal] = useState(false);
  const [errorVisible, setErrorVisible] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState(FILE_READ_ERROR);
  const [refreshing, setRefreshing] = useState(false);

  const onDismissSnackBar = () => setErrorVisible(false);

  // Simplifié par rapport à la version PouchDB : la table `attachments` WatermelonDB suit déjà
  // `upload_status` par pièce jointe (cf. database/schema.js et
  // SnackBarCheckFileUnsyncComponent.js), plus besoin de scanner les tableaux imbriqués
  // `issue.attachments[]`/`issue.reasons[]`/`phases[].tasks[].attachments[]` d'un unique gros
  // document ADL comme le faisait la version CouchDB.
  const getAndSetAttachments = useCallback(async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      const pending = await database.get('attachments')
        .query(Q.where('upload_status', Q.notEq('done')))
        .fetch();
      setAttachments(pending.map((a) => ({
        attachment: {
          id: a.id,
          isAudio: !!(a.contentType && a.contentType.startsWith('audio/')),
          local_url: a.localUri,
          uploaded: a.uploadStatus === 'done',
        },
        taskOrdinal: a.taskId || undefined,
      })));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    getAndSetAttachments();
  }, [getAndSetAttachments]);

  // Réutilise la même file d'upload JWT que la synchronisation automatique
  // (src/files/uploadQueue.js) — compression, limite de taille, retry compris.
  const syncImages = async () => {
    setLoading(true);
    let isError = false;

    try {
      // Feedback déjà géré ci-dessous (Snackbar dédiée) : pas besoin du toast générique.
      await enqueuePendingUploads({ notifyOnError: false });
    } catch (err) {
      console.log(err);
      isError = true;
      setErrorMessage(FILE_READ_ERROR_TRY_AGAIN);
      setErrorVisible(true);
    }

    const failedUploads = await database.get('attachments')
      .query(Q.where('upload_status', 'error'))
      .fetch();
    if (failedUploads.length > 0) {
      isError = true;
      setErrorMessage(FILE_READ_ERROR);
      setErrorVisible(true);
    }

    setLoading(false);
    if (!isError) setSuccessModal(true);
    await getAndSetAttachments();
  };

  return (
    <View style={{ flex: 1 }}>
      <Modal animationType="slide" style={{ flex: 1 }} visible={successModal}>
        <View
          style={{
            flex: 1,
            padding: 20,
            alignItems: 'center',
            justifyContent: 'space-around',
          }}
        >
          <View style={{ alignItems: 'center', marginTop: '20%' }}>
            <CheckCircle />
            <Text
              style={{
                marginVertical: 25,
                fontFamily: 'Poppins_700Bold',
                fontSize: 20,
                fontWeight: 'bold',
                fontStyle: 'normal',
                lineHeight: 25,
                letterSpacing: 0,
                textAlign: 'center',
                color: '#707070',
              }}
            >
              {t('sync_success')}
            </Text>
          </View>
          <SyncImage />
          <CustomGreenButton
            onPress={() => navigation.goBack()}
            buttonStyle={{
              width: '100%',
              height: 36,
              borderRadius: 7,
            }}
            textStyle={{
              fontFamily: 'Poppins_500Medium',
              fontSize: 14,
              lineHeight: 21,
              letterSpacing: 0,
              textAlign: 'right',
              color: '#ffffff',
            }}
          >
            {t('done')}
          </CustomGreenButton>
        </View>
      </Modal>
      {
        attachments?.filter(elt => ![undefined, null, ""].includes(elt?.local_url))?.length > 0 ? 
        <ImagesList attachments={attachments} getAndSetAttachments={getAndSetAttachments} refreshing={refreshing} /> 
        : <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ justifyContent: 'center', alignItems: 'center', padding: 20 }} 
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={getAndSetAttachments} />
              }
            >
              <View style={{marginTop: 25}}>
                <Text style={{color: 'grey'}}>{t('files_sync_currently')}</Text>
              </View>
          </ScrollView>
      }
      

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 10 }} />
      ) : <>
        {/* {attachments?.filter(elt => ![undefined, null, ""].includes(elt?.local_url))?.length > 0  ?  */}
        <View>
          <CustomGreenButton
            onPress={syncImages}
            buttonStyle={{
              height: 36,
              borderRadius: 7,
              marginHorizontal: '5%',
              width: '90%',
              marginBottom: 10,
            }}
            textStyle={{
              fontFamily: 'Poppins_500Medium',
              fontSize: 14,
              lineHeight: 21,
              letterSpacing: 0,
              textAlign: 'right',
              color: '#ffffff',
            }}
          >
            {t('sync')}
          </CustomGreenButton>
        </View>
         {/* : <></>} */}
      </>}
      <Snackbar visible={errorVisible} duration={3000} onDismiss={onDismissSnackBar}>
        {errorMessage}
      </Snackbar>
    </View>
  );
}

export default SyncAttachments;

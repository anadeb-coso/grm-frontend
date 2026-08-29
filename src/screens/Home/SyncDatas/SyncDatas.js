import React, { useState, useEffect } from 'react';
import { View, Modal, Text, Image } from 'react-native';
import { ActivityIndicator, Snackbar } from 'react-native-paper';
import * as Progress from 'react-native-progress';
import { useSelector } from 'react-redux';
import NetInfo from '@react-native-community/netinfo';
import { useTranslation } from 'react-i18next';
import { Q } from '@nozbe/watermelondb';
import { colors } from '../../../utils/colors';
import Datas from './components/Content';
import CustomGreenButton from '../../../components/CustomGreenButton/CustomGreenButton';
import SyncImage from '../../../../assets/sync-image.svg';
import CheckCircle from '../../../../assets/check-circle.svg';
import { database } from '../../../database';
import { runSyncSafely } from '../../../database/watermelonSyncManager';
import API from '../../../services/API';
import { subscribeSyncStatus } from '../../../database/watermelonSyncManager';


function SyncDatas({ navigation }) {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState(false);
  const [errorVisible, setErrorVisible] = React.useState(false);
  const [errorMessage, setErrorMessage] = useState(t('datas_sync_error'));
  const [connected, setConnected] = useState(true);
  const [message, setMessage] = useState(null);
  // Suivi de `onProgress` (src/database/sync.js) : la phase 'reset' signale un full resync forcé
  // par le serveur (last_pulled_at trop ancien, cf. CLAUDE.md §9) — la base locale est vidée puis
  // entièrement retéléchargée, ce qui peut prendre du temps ; on affiche une barre de progression
  // dédiée plutôt que le message générique "sync en cours".
  const [syncProgress, setSyncProgress] = useState(null);

  const onDismissSnackBar = () => setErrorVisible(false);
  const { userDocument: eadl } = useSelector((state) => state.get('userDocument').toObject());
  
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => subscribeSyncStatus(setIsSyncing), []);
  
  const check_network = async () => {
    NetInfo.fetch().then((state) => {
      if (!state.isConnected) {
          setErrorMessage(t('unable_access_wifi'));
          setErrorVisible(true);
          setConnected(false);
      }else if(!state.isInternetReachable){
          setErrorMessage(t('unable_access_internet'));
          setErrorVisible(true);
          setConnected(false);
      }
  });
  }

  const sync = async () => {

    setLoading(true);
    setSyncProgress(null);
    setConnected(true);
    await check_network();
    if(connected){
      // Appel legacy best-effort (notifie le serveur / vérifie les doublons pour les clients
      // pré-WatermelonDB encore en circulation, cf. issue/views_rest.py::SaveIssueDatas) : son
      // échec ne doit plus empêcher la vraie mise à jour des données locales ci-dessous — avant
      // ce correctif, `runSyncSafely` (le seul appel qui pull/push réellement les données via
      // WatermelonDB) n'était déclenché QUE si cet appel legacy réussissait, ce qui pouvait
      // laisser l'utilisateur avec des données locales périmées malgré un bouton "Sync" pressé
      // avec succès en apparence.
      try {
        const issueRecords = await database.get('issues').query(Q.where('confirmed', true)).fetch();
        const issues = issueRecords
          .filter((i) => i.reporterId === eadl.representative.id || i.assigneeId === eadl.representative.id)
          .map((i) => ({
            _id: i.id,
            internal_code: i.internalCode,
            tracking_code: i.trackingCode,
            description: i.description,
            confirmed: i.confirmed,
            reporter: i.reporterId ? { id: i.reporterId, name: i.reporterName } : null,
            assignee: i.assigneeId ? { id: i.assigneeId, name: i.assigneeName } : null,
          }));

        await new API()
          .sync_datas({issues: issues, email: eadl.representative.email}, i18n.language)
          .then(response => {
            if (response.message) {
              setMessage(response.message);
            }
            if (response.status == 'ok' && response.has_error) {
              setErrorMessage(t('some_datas_sync_error'));
              console.error(response.error);
              setErrorVisible(true);
            }
          })
          .catch(error => {
            console.error(error);
          });
      } catch (e) {
        console.log("Error1 : "+e);
      }

      // La vraie mise à jour des données locales (pull + push WatermelonDB), désormais toujours
      // tentée dès qu'il y a une connexion, quel qu'ait été le résultat de l'appel legacy ci-dessus.
      const succeeded = await runSyncSafely({ onProgress: setSyncProgress });
      if (succeeded) {
        setSuccessModal(true);
      } else {
        setErrorModal(true);
      }
    }
    setSyncProgress(null);
    setLoading(false);

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
            <Image
                style={{ height: 82, width: 82, margin: 'auto' }}
                resizeMode="stretch"
                source={require('../../../../assets/check-circle.png')}
                alt="image"
              />
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
          <Image
              style={{ height: 279.236, width: 222.51, margin: 'auto' }}
              resizeMode="stretch"
              source={require('../../../../assets/sync-image.png')}
              alt="image"
            />

             {message && <Text
              style={{
                marginHorizontal: 5,
                fontSize: 13,
                fontStyle: 'normal',
                letterSpacing: 0,
                textAlign: 'left',
                color: '#707070',
              }}
            >
              {message}
            </Text>}

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


      <Modal animationType="slide" style={{ flex: 1 }} visible={errorModal}>
        <View
          style={{
            flex: 1,
            padding: 20,
            alignItems: 'center',
            justifyContent: 'space-around',
          }}
        >
          <View style={{ alignItems: 'center', marginTop: '20%' }}>
            <Image
                style={{ height: 82, width: 82, margin: 'auto' }}
                resizeMode="stretch"
                source={require('../../../../assets/cross.png')}
                alt="image"
              />
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
              {t('sync_unsuccess')}
            </Text>
          </View>
          <Image
              style={{ height: 279.236, width: 222.51, margin: 'auto' }}
              resizeMode="stretch"
              source={require('../../../../assets/network_failed.png')}
              alt="image"
            />
          <CustomGreenButton
            onPress={() => {setErrorModal(false);}}
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
            {t('exit')}
          </CustomGreenButton>
        </View>
      </Modal>




      <Datas />
      {(isSyncing || loading) ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          {syncProgress?.phase === 'reset' || syncProgress?.phase === 'pull' ? (
            <>
              <Progress.Bar indeterminate width={200} color={colors.primary} />
              <Text style={{ fontSize: 16, marginTop: 12, textAlign: 'center' }} color="#000000">
                {syncProgress.phase === 'reset'
                  ? t('sync_full_resync_reset')
                  : t('sync_full_resync_downloading', { page: syncProgress.current })}
              </Text>
            </>
          ) : (
            <>
              <ActivityIndicator size="large" color="#24c38b" />
              <Text style={{ fontSize: 18, marginTop: 12 }} color="#000000">{t('sync_in_progress_take_time')}</Text>
            </>
          )}
        </View>
      ) : (
        <View>
          <CustomGreenButton
            onPress={sync}
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
      )}
      <Snackbar visible={errorVisible} duration={3000} onDismiss={onDismissSnackBar}>
        {errorMessage}
      </Snackbar>
    </View>
  );
}

export default SyncDatas;

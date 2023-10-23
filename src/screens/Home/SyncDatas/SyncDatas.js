import React, { useState } from 'react';
import { View, Modal, Text, Image } from 'react-native';
import { ActivityIndicator, Snackbar } from 'react-native-paper';
import { useSelector } from 'react-redux';
import NetInfo from '@react-native-community/netinfo';
import { colors } from '../../../utils/colors';
import Datas from './components/Content';
import { getEncryptedData } from '../../../utils/storageManager';
import CustomGreenButton from '../../../components/CustomGreenButton/CustomGreenButton';
import SyncImage from '../../../../assets/sync-image.svg';
import CheckCircle from '../../../../assets/check-circle.svg';
import { SyncToRemoteDatabase, LocalGRMDatabase } from "../../../utils/databaseManager";
import API from '../../../services/API';


function SyncDatas({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState(false);
  const [errorVisible, setErrorVisible] = React.useState(false);
  const [errorMessage, setErrorMessage] = useState("Nous n'avions pas pu synchroniser toutes vos données.");
  const [connected, setConnected] = useState(true);
  
  const onDismissSnackBar = () => setErrorVisible(false);
  const { username, userPassword } = useSelector((state) => state.get('authentication').toObject());
  const { userDocument: eadl } = useSelector((state) => state.get('userDocument').toObject());
  
  const check_network = async () => {
    NetInfo.fetch().then((state) => {
      if(!state.isConnected){
        setErrorMessage("Nous n'arrivons pas a accéder à l'internet. Veuillez vérifier votre connexion!");
        setErrorVisible(true);
        setConnected(false);
      }
  });
  }

  const sync = async () => {

    let succes = false;
    setLoading(true);
    setConnected(true);
    await check_network();
    if(connected){
      try {
        await LocalGRMDatabase.find({
          selector: { 
            type: 'issue',
            confirmed: true,
            "$or": [
              {
                "reporter.id": eadl.representative.id
              },
              {
                "assignee.id": eadl.representative.id
              }
            ]
           },
        })
          .then(async (result) => {
            let issues = result?.docs ?? [];
            await new API()
              .sync_datas({issues: issues, email: eadl.representative.email})
              .then(response => {
                console.log(response.status);
                if (!response.status || response.status != 'ok') {
                  console.error(response.error);
                  setErrorVisible(true);
                }else if (response.has_error) {
                  succes = true;
                  setErrorMessage("Certaines de vos données n'ont pas pu été synchronisées avec succès.");
                  console.error(response.error);
                  setErrorVisible(true);
                }else if(response.status && response.status == 'ok') {
                  succes = true;
                }
              })
              .catch(error => {
                console.error(error);
                console.log(error);
                setErrorVisible(true);
              });
  
          })
          .catch((err) => {
            console.log("Error1 : "+err);
            setErrorVisible(true);
          });
      } catch (e) {
        console.log("Error1 : "+e);
        setErrorVisible(true);
      }
      if (succes){
        setSuccessModal(true);
        try {
          const dbConfig = await getEncryptedData(
            `dbCredentials_${userPassword}_${username.replace('@', '')}`
          );
          await SyncToRemoteDatabase(dbConfig, username);
        } catch (e) {
          setErrorVisible(true);
        }
      }else{
        setErrorModal(true);
      }
    }
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
              Synchronisation {'\n'} Réussie!
            </Text>
          </View>
          <Image
              style={{ height: 279.236, width: 222.51, margin: 'auto' }}
              resizeMode="stretch"
              source={require('../../../../assets/sync-image.png')}
              alt="image"
            />
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
            DONE
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
              Synchronisation {'\n'} Non réussie!
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
            Sortir
          </CustomGreenButton>
        </View>
      </Modal>




      <Datas />
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#24c38b" />
          <Text style={{ fontSize: 18, marginTop: 12 }} color="#000000">Synchronisation en cours...{'\n'}Ceci peut prendre quelques secondes!</Text>
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
            Sync
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

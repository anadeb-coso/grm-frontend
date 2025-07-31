import React, { useState, useEffect } from 'react';
import { Snackbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { View, TouchableOpacity, Dimensions } from 'react-native';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { EXPO_PUBLIC_ANDROID_VERSION_CODE, EXPO_PUBLIC_PACKAGE, EXPO_PUBLIC_CDD_PLAYSTORE_URL } from '../../services/env';
import StoreProjectsAPI from '../../services/storeapp/storeprojects';


let height = Dimensions.get('window').height;
let width = Dimensions.get('window').width;
const DURATION_INDEFINITE = Number.MAX_SAFE_INTEGER;

function SnackBarCheckAppVersionComponent() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [errorVisible, setErrorVisible] = React.useState(false);
  const [errorMessage, setErrorMessage] = useState(t('new_version_alert_message'));
  const [storeProject, setStoreProject] = useState(null);


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


  return (
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
          <TouchableOpacity onPress={() => Linking.openURL(`${storeProject.app.apk_aws_s3_url.split("?")[0]}`)}
          >
            <Text style={{color: 'white'}} textAlign={'right'}>{t('see')}</Text>
          </TouchableOpacity>
        </View>}
      </View>
    </Snackbar>
  );
}

export default SnackBarCheckAppVersionComponent;

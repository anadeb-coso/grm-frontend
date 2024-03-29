import {
  Poppins_200ExtraLight,
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_400Regular_Italic,
  Poppins_500Medium,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { View, Text, ToastAndroid } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { ActivityIndicator } from 'react-native-paper';
import { init } from '../store/ducks/authentication.duck';
import { setCommune, setDocument } from '../store/ducks/userDocument.duck';
import { getUserDocs } from '../utils/databaseManager';
import { getEncryptedData } from '../utils/storageManager';
import PrivateRoutes from './privateRoutes';
import PublicRoutes from './publicRoutes';
import { logout } from '../store/ducks/authentication.duck';
import { verify_account_on_couchdb } from '../services/CouchDBRequest';

function Router({ theme }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  const { userPassword, username: fetchedUser } = useSelector((state) =>
    state.get('authentication').toObject()
  );


  useEffect(() => {
    async function fetchData() {
      // You can await here
      const { userDoc, userCommune } = await getUserDocs(fetchedUser);
      if (userDoc) {
        dispatch(setDocument(userDoc)); // Dispatch setDocument action
      }
      if (userCommune) {
        dispatch(setCommune(userCommune)); // Dispatch setCommune action
      }
      // ...
    }
    if (fetchedUser) fetchData();
  }, [dispatch, fetchedUser]);

  const getDBConfig = async () => {
    const password = await getEncryptedData('userPassword');
    let dbCredentials;
    let username;
    if (password) {
      username = await getEncryptedData(`username`);
      dbCredentials = await getEncryptedData(
        `dbCredentials_${password}_${username.replace('@', '')}`
      );

      if (username) {
        if (!(await verify_account_on_couchdb(dbCredentials, username))) {
          ToastAndroid.show("Nous n'arrivons pas avoir vos informations sur le serveur.", ToastAndroid.LONG);
          dispatch(logout());
        }
      }

      dispatch(init(dbCredentials, { password, email: username }));
    }
    setLoading(false);
  };

  useEffect(() => {
    getDBConfig();
  }, []);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_700Bold,
    Poppins_400Regular_Italic,
    Poppins_300Light,
    Poppins_200ExtraLight,
  });

  if (loading || !fontsLoaded) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#24c38b" />
      <Text style={{ fontSize: 18, marginTop: 12 }} color="#000000">Loading...</Text>
    </View>
  );

  return (
    <NavigationContainer theme={theme || DefaultTheme}>
      {userPassword ? <PrivateRoutes /> : <PublicRoutes />}
    </NavigationContainer>
  );
}

export default Router;

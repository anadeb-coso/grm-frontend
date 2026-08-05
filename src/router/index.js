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
import { View, Text } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { ActivityIndicator } from 'react-native-paper';
// import { useTranslation } from 'react-i18next';
import { init, logout } from '../store/ducks/authentication.duck';
import { setCommune, setDocument } from '../store/ducks/userDocument.duck';
import { getUserDocs } from '../utils/databaseManager';
import { getEncryptedData } from '../utils/storageManager';
import { getTokens, setOnSessionExpired } from '../api/client';
import PrivateRoutes from './privateRoutes';
import PublicRoutes from './publicRoutes';

function Router({ theme }) {
  const dispatch = useDispatch();
  // const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  const { isAuthenticated, username: fetchedUser } = useSelector((state) =>
    state.get('authentication').toObject()
  );


  useEffect(() => {
    async function fetchData() {
      try {
        const { userDoc, userCommune } = await getUserDocs();
        if (userDoc) {
          dispatch(setDocument(userDoc)); // Dispatch setDocument action
        }
        if (userCommune) {
          dispatch(setCommune(userCommune)); // Dispatch setCommune action
        }
      } catch (err) {
        console.warn('Unable to load user profile', err);
      }
    }
    if (fetchedUser) fetchData();
  }, [dispatch, fetchedUser]);

  // Restaure la session au lancement de l'app depuis le stockage chiffré local. La vérification
  // du compte se fait désormais via le JWT (src/api/client.js, rafraîchi/validé automatiquement
  // au premier appel réseau) plutôt que par un mot de passe mis de côté à cet effet : la
  // présence d'un token d'accès stocké (`getTokens()`) sert directement d'indicateur de session
  // — s'il est expiré/révoqué, le premier appel réseau échouera et `setOnSessionExpired`
  // (ci-dessous) déconnectera l'utilisateur proprement.
  const restoreSession = async () => {
    const tokens = await getTokens();
    if (tokens?.access) {
      const username = await getEncryptedData('username');
      dispatch(init({ email: username }));
    }
    setLoading(false);
  };

  useEffect(() => {
    restoreSession();
  }, []);

  // Quand le token JWT est expiré/révoqué et que le rafraîchissement automatique échoue
  // (src/api/client.js), on déconnecte réellement l'utilisateur : `logout()` remet
  // `isAuthenticated` à `false` dans le store, ce qui fait basculer automatiquement ce composant
  // sur `PublicRoutes` (écran de connexion) via le rendu conditionnel ci-dessous — pas besoin de
  // navigation manuelle.
  useEffect(() => {
    setOnSessionExpired(() => dispatch(logout()));
    return () => setOnSessionExpired(null);
  }, [dispatch]);

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
      {isAuthenticated ? <PrivateRoutes /> : <PublicRoutes />}
    </NavigationContainer>
  );
}

export default Router;

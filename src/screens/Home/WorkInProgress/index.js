import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, Text, ImageBackground, ScrollView, View } from 'react-native';
import { Button, ActivityIndicator } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../../store/ducks/authentication.duck';
import LanguageSelector from '../../../translations/LanguageComponent';
import { setCommune, setDocument } from '../../../store/ducks/userDocument.duck';
import { colors } from '../../../utils/colors';
import { getUserDocs } from '../../../utils/databaseManager';

export function WorkInProgress() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { username } = useSelector((state) => state.get('authentication').toObject());
  const { userDocument: eadl } = useSelector((state) => state.get('userDocument').toObject());

  useEffect(() => {
    const fetchUserCommune = async () => {
      if (!eadl) {
        const { userDoc, userDocument: usrC } = await getUserDocs(username);
        if (userDoc) {
          dispatch(setDocument(userDoc)); // Dispatch setDocument action
        }
        if (usrC) {
          dispatch(setCommune(usrC)); // Dispatch setCommune action
        }
      }
    };

    fetchUserCommune(); // Call the fetch userDocument data function
  }, [dispatch, eadl, username]);

  
  if(!eadl) return <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} size="small" />;
  else console.log(eadl);
  
  return (
    <ScrollView style={{ flex: 1, margin: 25 }} >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ImageBackground source={{ uri: eadl.representative.photo }} 
          style={{width: '100%', height: 300, marginBottom: 20}} 
          imageStyle={{ borderRadius: 75 }}>
          <Text style={{ marginTop: 250, textAlign: 'center', }}>{eadl.representative.name}</Text>
          <Text style={{ textAlign:'center',fontSize:13, color:'blue' }}>{eadl.representative.email}</Text>
          <Text style={{ textAlign:'center', fontSize:13, color:'blue' }}>{eadl.representative.phone}</Text>
        </ImageBackground>
      </View>

      <LanguageSelector /> 
      {/* <Text>Work in Progress </Text> */}
      <Button color="#24c38b" onPress={() => dispatch(logout())}>
        {t('logout')}
      </Button>
    </ScrollView>
  );
}

export default WorkInProgress;

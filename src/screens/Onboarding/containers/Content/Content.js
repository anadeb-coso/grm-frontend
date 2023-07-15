import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View, TouchableOpacity } from 'react-native';
import { Button, Title } from 'react-native-paper';
import { styles } from './Content.style';
// import { PreferencesContext } from "@providers/PreferencesProvider/PreferencesContext";
import ThinkingSVG from '../../../../../assets/think.svg';
import LanguageSelector from '../../../../translations/LanguageComponent';

function Content() {
  const { t } = useTranslation();

  // const { colors } = useTheme();
  const [step, setStep] = useState(2);
  const customStyles = styles();
  const navigation = useNavigation();

  return (
    <View style={customStyles.content}>
      {/* <MapBg */}
      {/*  width={320} */}
      {/*  style={{ */}
      {/*    position: "absolute", */}
      {/*    top: -10, */}
      {/*    left: 20, */}
      {/*    bottom: 0, */}
      {/*  }} */}
      {/* /> */}

      <View>{/* <EADLLogo height={90} width={180} style={{ marginTop: 100 }} /> */}</View>
      {/* </ImageBackground> */}
      <View>
        <ThinkingSVG />
      </View>
      {/* <Title style={customStyles.upperTitle}>Welcome to EADL</Title> */}
      <View>
        <Title style={customStyles.title}>{t('used_app_before')}</Title>
      </View>

      <View style={customStyles.buttonsView}>
        <Button
          style={[customStyles.button, { backgroundColor: '#24c38b' }]}
          mode="contained"
          onPress={() => {
            navigation.navigate('AuthStack', { screen: 'Login' });
          }}
        >
          {t('yes')}
        </Button>
        <Button
          style={customStyles.button}
          color="white"
          mode="contained"
          onPress={() => {
            navigation.navigate('AuthStack', { screen: 'SignUp' });
          }}
        >
          {t('no')}
        </Button>
      </View>
      <View>
        {/* <Text>V:1.0.1</Text> */}
      </View>
      <LanguageSelector />

      <TouchableOpacity onPress={() => Linking.openURL("https://cheery-sable-3fbd0b.netlify.app/")}>
        <Text style={{ color: 'green' }}>{t('privacy_policy')}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default Content;

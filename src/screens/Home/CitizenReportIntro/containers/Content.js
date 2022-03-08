import React from 'react';
import { View, ScrollView, Text, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button } from 'react-native-paper';
import i18n from 'i18n-js';
import CrowdImage from '../../../../../assets/crowd.svg';
import { styles } from './Content.styles';
import { colors } from '../../../../utils/colors';

const screenWidth = Dimensions.get('window').width;

const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: 'white',
    placeholder: '#dedede',
    text: '#707070',
  },
};

function Content() {
  const navigation = useNavigation();

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'position' : null}>
        <View style={{ padding: 23 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <CrowdImage height={90} width={screenWidth * 0.3} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.title}>{i18n.t('welcome_citizen_input')}</Text>
            </View>
          </View>
          <Text style={styles.stepNote}>{i18n.t('intro_text_0')}</Text>
          <Text style={[styles.stepNote, { fontFamily: 'Poppins_400Regular_Italic' }]}>
            {i18n.t('intro_text_1')}
          </Text>
          <Text style={styles.stepNote}>"{i18n.t('intro_text_2')}"</Text>
          <Text style={styles.stepNote}>"{i18n.t('intro_text_3')}"</Text>
          <Text style={styles.stepNote}>"{i18n.t('intro_text_4')}"</Text>
          <Text style={styles.stepNote}>"{i18n.t('intro_text_5')}"</Text>
          <Text style={styles.stepNote}>"{i18n.t('intro_text_6')}"</Text>
        </View>

        <View style={{ paddingHorizontal: 50 }}>
          <Button
            theme={theme}
            style={{ alignSelf: 'center', margin: 0 }}
            labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
            mode="contained"
            onPress={() => {
              navigation.navigate('CitizenReport');
            }}
          >
            {i18n.t('next')}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

export default Content;

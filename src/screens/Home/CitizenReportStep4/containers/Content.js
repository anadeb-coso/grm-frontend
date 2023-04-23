import { useBackHandler } from '@react-native-community/hooks';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, ScrollView, Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import LockImage from '../../../../../assets/lock.svg';
import { colors } from '../../../../utils/colors';
import { styles } from './Content.styles';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: 'white',
    placeholder: '#dedede',
    text: '#707070',
  },
};

function Content({ issue }) {
  const { t } = useTranslation();

  const navigation = useNavigation();

  useBackHandler(
    () =>
      // navigation.navigate("GRM")
      // handle it
      true
  );

  return (
    <ScrollView>
      <View style={{ padding: 23 }}>
        <Text style={styles.stepText}>{t('step_6')}</Text>
        <Text style={styles.stepSubtitle}>{t('step_4_subtitle')}</Text>
        <Text style={styles.stepDescription}>{t('step_4_description')}</Text>
        <Text style={styles.stepDescription} />
        <Text style={styles.stepDescription}>{t('step_5_description')}</Text>
        <Text style={styles.stepDescription} />
        <Text style={styles.stepDescription}>{t('step_6_description')}</Text>
      </View>

      <LockImage
        style={{ alignSelf: 'center' }}
        height={screenHeight * 0.2}
        width={screenWidth * 0.5}
      />
      <Text style={[styles.stepSubtitle, { textAlign: 'center' }]}>{t('step_4_issue_code')}</Text>
      <Text
        style={{
          fontSize: 49,
          fontWeight: 'bold',
          textAlign: 'center',
          color: colors.primary,
          marginBottom: 40,
        }}
      >
        {issue.tracking_code}
      </Text>
      <View style={{ alignSelf: 'center' }}>
        {/* <View */}
        {/*  style={{ */}
        {/*    flexDirection: "row", */}
        {/*    justifyContent: "center", */}
        {/*    marginBottom: 23, */}
        {/*  }} */}
        {/* > */}
        {/*  <Button */}
        {/*    theme={theme} */}
        {/*    style={{ */}
        {/*      alignSelf: "center", */}
        {/*      marginRight: 7, */}
        {/*      backgroundColor: "#dedede", */}
        {/*    }} */}
        {/*    labelStyle={{ color: "white", fontFamily: "Poppins_500Medium" }} */}
        {/*    mode="contained" */}
        {/*    onPress={() => console.log("Pressed")} */}
        {/*  > */}
        {/*    {t("step_4_short_code")} */}
        {/*  </Button> */}
        {/*  <Button */}
        {/*    theme={theme} */}
        {/*    style={{ */}
        {/*      alignSelf: "center", */}
        {/*      marginLeft: 7, */}
        {/*      backgroundColor: "#dedede", */}
        {/*    }} */}
        {/*    labelStyle={{ color: "white", fontFamily: "Poppins_500Medium" }} */}
        {/*    mode="contained" */}
        {/*    onPress={() => console.log("Pressed")} */}
        {/*  > */}
        {/*    {t("step_4_two_word_code")} */}
        {/*  </Button> */}
        {/* </View> */}

        <Button
          theme={theme}
          labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
          mode="contained"
          onPress={() => navigation.navigate('GRM')}
        >
          {t('step_4_back_text')}
        </Button>
      </View>
    </ScrollView>
  );
}

export default Content;

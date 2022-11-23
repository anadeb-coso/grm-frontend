import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, Platform, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button, IconButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import moment from 'moment';
import i18n from 'i18n-js';
import { LocalGRMDatabase } from '../../../../utils/databaseManager';
import { colors } from '../../../../utils/colors';
import { styles } from './Content.styles';
import { Audio } from 'expo-av';

const SAMPLE_WORDS = ['car', 'house', 'tree', 'ball'];
const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: 'white',
    placeholder: '#dedede',
    text: '#707070',
  },
};

function Content({ issue, eadl }) {
  const navigation = useNavigation();
  // const incrementId = () => {
  //   const last = eadl.bp_projects[eadl.bp_projects.length - 1];
  //   if (!eadl.bp_projects[0]) return 1;
  //   return parseInt(last.id.split('-')[1]) + 1;
  // };
  const randomWord = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const [sound, setSound] = useState();
  const [playing, setPlaying] = useState(false);
  const submitIssue = () => {
    const isAssignee =
      issue.category?.assigned_department === eadl?.department &&
      issue.category?.administrative_level === eadl?.administrative_level;
    // submit params
    const randomCodeNumber = Math.floor(Math.random() * 1000);
    // const newId = incrementId();
    const _issue = {
      internal_code: '',
      tracking_code: `${randomWord(SAMPLE_WORDS)}${randomCodeNumber}`,
      auto_increment_id: '',
      title: issue.issueSummary,
      description: issue.additionalDetails,
      attachments: [
        ...(issue?.attachments ? issue.attachments : []),
        ...(issue?.recording ? [issue.recording] : []),
      ],
      status: {
        name: i18n.t('open'),
        id: 1,
      },
      confirmed: true,
      assignee: isAssignee ? { id: eadl._id, name: eadl.representative?.name } : '',
      reporter: {
        id: eadl._id,
        name: eadl.representative.name,
      },
      citizen_age_group: issue.ageGroup,
      citizen: issue.name ?? '',
      contact_medium: issue.typeOfPerson,
      citizen_type: issue.citizen_type,
      citizen_group_1: issue.citizen_group_1,
      citizen_group_2: issue.citizen_group_2,
      location_info: {
        issue_location: issue.issueLocation,
        location_description: issue.locationDescription,
      },
      administrative_region: issue.issueLocation,
      // category: {
      //   id: 1,
      //   name: "Environmental",
      //   confidentiality_level: "Confidential",
      // },
      category: issue.category,
      issue_type: issue.issueType,
      //   type: {
      //   id: 1,
      //   name: "Complaint",
      // },
      created_date: new Date(),
      resolution_days: 0,
      resolution_date: '',
      intake_date: new Date(),
      issue_date: issue.date,
      ongoing_issue: issue.ongoingEvent,
      comments: [],
      contact_information: {
        type: issue.methodOfContact,
        contact: issue.contactInfo,
      },
      commune: {
        code: eadl.commune,
        name: eadl.name,
        prefecture: '',
      },
      type: 'issue',
    };
    createIssue(_issue);
    // navigation.navigate("CitizenReportStep4");
  };

  const createIssue = (_issue) => {
    LocalGRMDatabase.post(_issue)
      .then((response) => {
        navigation.navigate('CitizenReportStep4', { issue: _issue });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const playSound = async (recordingUri) => {
    if(playing === false) {
      setPlaying(true)
      // console.log("Loading Sound");
      const { sound } = await Audio.Sound.createAsync({ uri: recordingUri });
      setSound(sound);
      // console.log("Playing Sound");
      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate((status) => {
        if(status.didJustFinish) {
          setPlaying(false)
        }
      })
    }
    // setPlaying(false)
  };

  React.useEffect(
    () =>
      sound
        ? () => {
          // console.log("Unloading Sound");
          sound.unloadAsync();

        }
        : undefined,
    [sound]
  );



  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, we need camera roll permissions to make this work!');
        }
      }
    })();
  }, []);
  return (
    <ScrollView>
      <View style={{ padding: 23 }}>
        <Text style={styles.stepText}>{i18n.t('step_5')}</Text>
        <Text style={styles.stepSubtitle}>{i18n.t('step_3_confirmation')}</Text>
        <Text style={styles.stepDescription}>{i18n.t('step_3_subtitle')}</Text>
      </View>

      <View
        style={{
          margin: 23,
          padding: 18,
          borderRadius: 10,
          shadowColor: 'rgba(0, 0, 0, 0.05)',
          shadowOffset: {
            width: 0,
            height: 3,
          },
          shadowRadius: 15,
          shadowOpacity: 1,

          elevation: 7,
          backgroundColor: 'white',
        }}
      >
        <Text style={styles.stepSubtitle}>{i18n.t('step_3_field_title_1')}</Text>
        <Text style={styles.stepDescription}>
          {issue.date !== 'null' && !!issue.date ? moment(issue.date).format('DD-MMMM-YYYY') : '--'}
        </Text>
        <Text style={styles.stepSubtitle}>{i18n.t('step_3_field_title_2')}</Text>
        <Text style={styles.stepDescription}>{issue.issueType?.name ?? '--'}</Text>
        <Text style={styles.stepSubtitle}>{i18n.t('step_3_field_title_3')}</Text>
        <Text style={styles.stepDescription}>{issue.category?.name ?? '--'}</Text>

        <Text style={styles.stepSubtitle}>{i18n.t('step_3_field_title_4')}</Text>
        <Text style={styles.stepDescription}>{issue.additionalDetails ?? '--'}</Text>
        <Text style={styles.stepSubtitle}>{i18n.t('step_3_attachments')}</Text>
        {issue.recording && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              // justifyContent: 'center',
            }}
          >
            <IconButton icon="play" color={playing ? colors.disabled : colors.primary} size={24} onPress={() => playSound(issue.recording.local_url)} />
            <Text
              style={{
                fontFamily: 'Poppins_400Regular',
                fontSize: 12,
                fontWeight: 'normal',
                fontStyle: 'normal',
                lineHeight: 18,
                letterSpacing: 0,
                textAlign: 'left',
                color: '#707070',
                marginVertical: 13,
              }}
            >
              {i18n.t('play_recorded_audio')}
            </Text>
          </View>
        )}
        {issue.attachments && issue.attachments.length > 0 && issue.attachments.map((attachment) => (

          <Image
            source={{ uri: attachment.local_url }}
            style={{
              height: 80,
              width: 80,
              justifyContent: 'flex-end',
              marginVertical: 20,
              marginLeft: 20
            }}
          />
        ))}
      </View>
      <View style={{ paddingHorizontal: 50 }}>
        <Button
          theme={theme}
          style={{ alignSelf: 'center', margin: 24 }}
          labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
          mode="contained"
          onPress={() => submitIssue()}
        >
          {i18n.t('submit_button_text')}
        </Button>
      </View>
    </ScrollView>
  );
}

export default Content;

import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image, Platform, ScrollView, Text, View, ImageBackground, TouchableOpacity, ToastAndroid,
  StyleSheet, Animated
} from 'react-native';
import { Button, IconButton } from 'react-native-paper';
import { colors } from '../../../../utils/colors';
import LocalDatabase, { LocalGRMDatabase } from '../../../../utils/databaseManager';
import { styles } from './Content.styles';
import { logout } from '../../../../store/ducks/authentication.duck';
import { useDispatch } from 'react-redux';
import { getEncryptedData } from '../../../../utils/storageManager';
import { verify_account_on_couchdb } from '../../../../services/CouchDBRequest';

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

const styles_audio = StyleSheet.create({
  container: {
    height: 7,
    backgroundColor: '#ccc',
    borderRadius: 10,
    margin: 10,
    width: 150,
  },
  bar: {
    height: 7,
    backgroundColor: '#333',
    borderRadius: 10,
  },
});

function Content({ issue, eadl, issues }) {
  const { t } = useTranslation();
  let _index = 0;

  const dispatch = useDispatch();
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
    }
  };
  useEffect(() => {
    getDBConfig();
  }, []);



  const navigation = useNavigation();
  // const incrementId = () => {
  //   const last = eadl.bp_projects[eadl.bp_projects.length - 1];
  //   if (!eadl.bp_projects[0]) return 1;
  //   return parseInt(last.id.split('-')[1]) + 1;
  // };
  const randomWord = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const [sound, setSound] = useState();
  const [soundOnPause, setSoundOnPause] = useState(false);
  const [soundUrl, setSoundUrl] = React.useState();
  const [duration, setDuration] = useState(null);
  const [position, setPosition] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [attachments, setAttachments] = useState(
    [
      ...(issue?.attachments ? issue.attachments : []),
      ...(issue?.recordings ? issue.recordings : [])//,
      // ...(issue?.recording ? [issue.recording] : [])
    ]
  );

  function removeAttachment(id) {
    setSoundOnPause(false);
    let elt = attachments.find(elt => elt.id == id);
    if (elt && elt.isAudio) {
      stopASound();
    }

    const array = attachments.filter(elt => elt.id !== id);
    setAttachments(array);
  }


  const submitIssue = () => {

    const isAssignee =
      issue.category?.assigned_department === eadl?.department
      && issue.administrative_region?.administrative_id === eadl?.administrative_region;
    //  &&
    // issue.category?.administrative_level === eadl?.administrative_level;
    // submit params
    const randomCodeNumber = Math.floor(Math.random() * 1000);
    // const newId = incrementId();
    const _issue = {
      internal_code: "",//issue.category?.abbreviation+'-'+issue.issueLocation.administrative_id+'-'+String(issues ? (issues.length+1) : 1),
      tracking_code: `${randomWord(SAMPLE_WORDS)}${randomCodeNumber}`,
      auto_increment_id: "",//issues ? (issues.length+1) : 1,
      title: issue.issueSummary,
      description: issue.additionalDetails,
      attachments: attachments,
      // [
      //   ...(issue?.attachments ? issue.attachments : []),
      //   ...(issue?.recording ? [issue.recording] : []),
      // ],
      status: {
        name: t('initial_status'),
        id: 1,
      },
      confirmed: true,
      assignee: isAssignee ? { id: eadl.representative?.id, name: eadl.representative?.name } : '',
      reporter: {
        id: eadl.representative?.id,
        name: eadl.representative?.name,
      },
      citizen_age_group: issue.ageGroup,
      citizen: issue.name ?? '',
      contact_medium: issue.typeOfPerson,
      citizen_type: issue.citizen_type,
      citizen_group_1: issue.citizen_group_1,
      citizen_group_2: issue.citizen_group_2,
      citizen_or_group: issue.citizen_or_group,
      location_info: {
        issue_location: issue.issueLocation,
        location_description: issue.locationDescription,
      },
      administrative_region: issue.issueLocation,
      structure_in_charge: issue.structure_in_charge,
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
      reject_date: '',
      intake_date: new Date(),
      issue_date: issue.date,
      ongoing_issue: issue.ongoingEvent,
      event_recurrence: issue.eventRecurrence,
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
      source: 'mobile',
      publish: false,
      notification_send: false
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
    if (playing === false) {
      setPlaying(true);
      // console.log("Loading Sound");
      const { sound } = await Audio.Sound.createAsync({ uri: recordingUri });
      setSound(sound);
      // console.log("Playing Sound");
      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlaying(false);
        }
      });
    }
    // setPlaying(false)
  };

  const onPlaybackStatusUpdate = (status) => {
    setDuration(status.durationMillis);
    setPosition(status.positionMillis);
    // setFinish(status.didJustFinish);

    if (status.didJustFinish) {
      setSound(undefined);
      setSoundUrl(undefined);
    }
  }

  const stopASound = async () => {
    setSoundOnPause(false);
    await sound.stopAsync();
    setSound(undefined);
    setSoundUrl(undefined);
  };

  const pauseASound = async () => {
    setSoundOnPause(true);
    await sound.pauseAsync();
  };

  const playASoundOnCurrentPause = async () => {
    setSoundOnPause(false);
    await sound.playAsync();
  };


  const playASound = async (sound_url) => {
    setSoundOnPause(false);
    // console.log("Loading Sound");
    if (sound) {
      stopASound();
      setSound(undefined);
      setSoundUrl(undefined);
    }

    const { sound } = await Audio.Sound.createAsync(
      { uri: sound_url },
      { shouldPlay: true },
      onPlaybackStatusUpdate
    );
    setSound(sound);
    setSoundUrl(sound_url);
    // console.log("Playing Sound");
    await sound.playAsync();

  };


  const getProgress = () => {
    if (
      sound === undefined || sound === null ||
      duration === undefined || duration === null ||
      position === undefined || position === null) {
      return 0;
    }

    return (position / duration) * 150;
  }

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
        <Text style={styles.stepText}>{t('step_5')}</Text>
        <Text style={styles.stepSubtitle}>{t('step_3_confirmation')}</Text>
        <Text style={styles.stepDescription}>{t('step_3_subtitle')}</Text>
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
        <Text style={styles.stepSubtitle}>{t('step_3_field_title_1')}</Text>
        <Text style={styles.stepDescription}>
          {issue.date !== 'null' && !!issue.date ? moment(issue.date).format('DD-MMMM-YYYY') : '--'}
        </Text>
        <Text style={styles.stepSubtitle}>{t('step_3_field_title_2')}</Text>
        <Text style={styles.stepDescription}>{issue.issueType?.name ?? '--'}</Text>
        <Text style={styles.stepSubtitle}>{t('step_3_field_title_3')}</Text>
        <Text style={styles.stepDescription}>{issue.category?.name ?? '--'}</Text>

        <Text style={styles.stepSubtitle}>{t('step_3_field_title_4')}</Text>
        <Text style={styles.stepDescription}>{issue.additionalDetails ?? '--'}</Text>
        <Text style={styles.stepSubtitle}>{t('step_3_attachments')}</Text>
        {/* {issue.recording && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              // justifyContent: 'center',
            }}
          >
            <IconButton
              icon="play"
              color={playing ? colors.disabled : colors.primary}
              size={24}
              onPress={() => playSound(issue.recording.local_url)}
            />
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
              {t('play_recorded_audio')}
            </Text>
            <IconButton
              icon="close"
              color={colors.error}
              size={24}
              onPress={() => removeAttachment(issue.recording.id)}
            />
          </View>
        )} */}
        {attachments &&
          attachments.length > 0 &&
          attachments.map((attachment, index) => {
            if (attachment.isAudio) {
              _index++;
              return (
                <View
                  key={`${attachment.id} ${attachment.local_url}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    // justifyContent: 'center',
                  }}
                >
                  {/* <IconButton
                    icon="play"
                    color={playing ? colors.disabled : colors.primary}
                    size={24}
                    onPress={() => playSound(attachment.local_url)}
                  />
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
                    {t('play_recorded_audio')} 
                  </Text> */}
                  <IconButton icon={!soundOnPause && soundUrl == attachment.local_url ? "pause" : "play"} color={colors.primary} size={24} onPress={
                    () => soundUrl == attachment.local_url ? (soundOnPause ? playASoundOnCurrentPause() : pauseASound()) : playASound(attachment.local_url)
                  } />
                  <View style={styles_audio.container}>
                    <Animated.View style={[styles_audio.bar, { width: soundUrl == attachment.local_url ? getProgress() ?? 0 : 0 }]} />
                  </View>
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
                    {`(${_index})`}
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Poppins_400Regular',
                      fontSize: 12,
                      fontWeight: 'normal',
                      fontStyle: 'normal',
                      lineHeight: 18,
                      letterSpacing: 0,
                      textAlign: 'left',
                      marginVertical: 13,
                      marginLeft: 7
                    }}
                  >{parseInt(String(soundUrl == attachment.local_url && position ? position / 1000 : 0))}</Text>
                  <IconButton
                    icon="close"
                    color={colors.error}
                    size={24}
                    onPress={() => removeAttachment(attachment.id)}
                  />
                </View>
              );
            }
          })

        }


        {attachments &&
          attachments.length > 0 &&
          // issue.attachments.map((attachment) => (
          //   <Image
          //     source={{ uri: attachment.local_url }}
          //     style={{
          //       height: 80,
          //       width: 80,
          //       justifyContent: 'flex-end',
          //       marginVertical: 20, 
          //       marginLeft: 20,
          //     }}
          //   />
          // ))
          attachments.map((attachment, index) => {
            if (!attachment.isAudio) {
              return (
                <ImageBackground
                  key={`${attachment.id} ${attachment.local_url}`}
                  source={{ uri: attachment.local_url }}
                  style={{
                    height: 80,
                    width: 80,
                    marginHorizontal: 1,
                    alignSelf: 'flex-start',
                    justifyContent: 'flex-end',
                    marginVertical: 20,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => removeAttachment(attachment.id)}
                    style={{
                      alignItems: 'center',
                      padding: 5,
                      backgroundColor: 'rgba(255, 1, 1, 1)',
                    }}
                  >
                    <Text style={{ color: 'white' }}>X</Text>
                  </TouchableOpacity>
                </ImageBackground>
              )
            }
          })

        }
      </View>
      <View style={{ paddingHorizontal: 50 }}>
        <Button
          theme={theme}
          disabled={!eadl}
          style={{ alignSelf: 'center', margin: 24 }}
          labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
          mode="contained"
          onPress={() => submitIssue()}
        >
          {t('submit_button_text')}
        </Button>
      </View>
    </ScrollView>
  );
}

export default Content;

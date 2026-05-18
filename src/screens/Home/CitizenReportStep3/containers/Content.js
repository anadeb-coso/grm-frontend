import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image, Platform, ScrollView, Text, View, ImageBackground, TouchableOpacity, ToastAndroid,
  StyleSheet, Animated, Alert, Modal, Dimensions
} from 'react-native';
import { useToast } from 'react-native-toast-notifications';
import { Button, IconButton, ActivityIndicator } from 'react-native-paper';
import { Snackbar } from 'react-native-paper';
import NetInfo from '@react-native-community/netinfo';
import { FontAwesome } from '@expo/vector-icons';
import Pdf from 'react-native-pdf';
import { v4 as uuidv4 } from 'uuid';
import { WebView } from 'react-native-webview';
import { colors } from '../../../../utils/colors';
import LocalDatabase, { LocalGRMDatabase } from '../../../../utils/databaseManager';
import { styles } from './Content.styles';
import { logout } from '../../../../store/ducks/authentication.duck';
import { useDispatch, useSelector } from 'react-redux';
import { getEncryptedData } from '../../../../utils/storageManager';
import { verify_account_on_couchdb } from '../../../../services/CouchDBRequest';
import { VERY_SENSITIVE } from '../../../../utils/utils';
import { showDoc } from '../../../../utils/functions';
import { baseURL } from '../../../../services/API';
import { uploadFile } from '../../../../services/upload';
import { couchDBURLBase } from '../../../../utils/databaseManager';
import DownloadComponent from '../../../../components/DownloadComponent/DownloadComponent';
import { check_issues } from '../../../../utils/functionsRequestsToApi';

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
const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

function Content({ issue, eadl, issues }) {
  const { t, i18n } = useTranslation();
  var toast = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [dbUsername, setDBUsername] = useState(null);
  const [dbPassword, setDBPassword] = useState(null);
  const [modalVisibleFile, setModalVisibleFile] = useState(false);
  const [localPath, setLocalPath] = useState(null);
  const [url, setUrl] = useState(null);
  const [urlSyncing, setUrlSyncing] = useState(null);

  let _index = 0;

  const dispatch = useDispatch();

  const { username, userPassword } = useSelector((state) => state.get('authentication').toObject());

  const getDBConfig = async () => {
    const password = await getEncryptedData('userPassword');
    let dbCredentials;
    let user_name;
    if (password) {
      user_name = await getEncryptedData(`username`);
      dbCredentials = await getEncryptedData(
        `dbCredentials_${password}_${user_name.replace('@', '')}`
      );

      if (user_name) {
        if (!(await verify_account_on_couchdb(dbCredentials, user_name))) {
          ToastAndroid.show(t('unable_retrieve_your_information'), ToastAndroid.LONG);
          dispatch(logout());
        }
      }
    }
  };
  useEffect(() => {
    getDBConfig();
  }, []);

  const [connected, setConnected] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [errorVisible, setErrorVisible] = useState(false);
  const onDismissSnackBar = () => setErrorVisible(false);
  const check_network = async () => {
    NetInfo.fetch().then((state) => {
      if (!state.isConnected) {
          setErrorMessage(t('unable_access_wifi'));
          setErrorVisible(true);
          setConnected(false);
      }else if(!state.isInternetReachable){
          setErrorMessage(t('unable_access_internet'));
          setErrorVisible(true);
          setConnected(false);
      }

    });
  }

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



  const uploadImages = async () => {
    setConnected(true);
    check_network();
    if (connected) {
      setIsSyncing(true);

      const dbConfig = await getEncryptedData(
        `dbCredentials_${userPassword}_${username.replace('@', '')}`
      );
      setDBUsername(dbConfig?.username);
      setDBPassword(dbConfig?.password);

      try {
        let count = 0;
        let elt_id;
        const updatedAttachments = [...attachments];
        for (let i = 0; i < attachments.length; i++) {
          let elt = attachments[i];

          if (elt && elt?.local_url && elt?.local_url && elt?.local_url.includes("file://") && !elt.uploaded) {
            try {
              const response = await uploadFile(
                `${baseURL}/attachments/upload-to-issue`,
                {

                  username: dbConfig?.username,
                  password: dbConfig?.password,
                  url: elt?.local_url,
                  isAudio: elt?.isAudio,
                  mimeType: elt?.mimeType
                }
              );

              if (response.fileUrl) {
                elt_id = updatedAttachments.findIndex((e, i) => e.id == elt.id);
                elt.url_uploaded = response.fileUrl;
                updatedAttachments[elt_id] = {
                  ...updatedAttachments[elt_id],
                  uploaded: true,
                  bd_id: response.bd_id,
                  url: response.fileUrl,
                  local_url: '',
                };

                count++;
              } else if (response.file) {
                Alert.alert('Alert', response.file[0], [
                  {
                    text: "OK", onPress: () => { }
                  }
                ]);
              } else {
                Alert.alert('Alert', t('attachment_error', { name: elt.name }), [
                  {
                    text: "OK", onPress: () => { }
                  }
                ]);
              }

            } catch (e) {
              setIsSyncing(false);
              Alert.alert('Alert', t('attachment_error', { name: elt.name }), [
                {
                  text: "OK", onPress: () => { }
                }
              ]);
            }

          }
        }
        setIsSyncing(false);
        if (count != 0) {
          setAttachments(updatedAttachments);
          if (count == 1) {
            toast.show(t('attachment_synchronized'), {
              type: "success",
              placement: "bottom",
              duration: 3000,
            });
          } else {
            toast.show(t('attachments_synchronized'), {
              type: "success",
              placement: "bottom",
              duration: 3000,
            });
          }

        }

      } catch (e) {
        setIsSyncing(false);
        Alert.alert('Alert', t('attach_all_attachments'), [
          {
            text: "OK", onPress: () => { }
          }
        ]);
      }
    }
  };





  const submitIssue = async () => {

    // const isAssignee =
    //   issue.category?.assigned_department === eadl?.department
    //   && issue.administrative_region?.administrative_id === eadl?.administrative_region;
    const isAssignee = issue.category?.confidentiality_level != VERY_SENSITIVE;

    //  &&
    // issue.category?.administrative_level === eadl?.administrative_level;
    // submit params
    const randomCodeNumber = Math.floor(Math.random() * 1000);
    // const newId = incrementId();
    const _issue = {
      uuid: uuidv4(),
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


    //Check Issues to sync (new issues, escalade issues, assignment)
    check_issues(
      await getEncryptedData(
        `dbCredentials_${userPassword}_${username.replace('@', '')}`
      ),
      eadl, i18n.language);


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

      const { sound } = await Audio.Sound.createAsync({ uri: recordingUri });
      setSound(sound);

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
    
    if (sound_url && !sound_url.includes("file://")) {
      setIsSyncing(true);
      sound_url = `file://${await showDoc({ url: sound_url }, dbUsername, dbPassword, false)}`;
      setIsSyncing(false);
    }
    
    setSoundOnPause(false);

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
        {/* <Text style={styles.stepDescription}>{issue.issueType?.name ?? '--'}</Text>
        <Text style={styles.stepSubtitle}>{t('step_3_field_title_3')}</Text> */}
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
              iconColor={playing ? colors.disabled : colors.primary}
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
              iconColor={colors.error}
              size={24}
              onPress={() => removeAttachment(issue.recording.id)}
            />
          </View>
        )} */}
        {attachments &&
          attachments.length > 0 &&
          attachments.map((attachment, index) => {
            if (attachment.isAudio) {
              let audio_url = (attachment.local_url ? (attachment.local_url && attachment.local_url != "" ? attachment.local_url : undefined) : undefined) ?? (attachment.url ?? attachment.uri);
              let audio_url_split = audio_url.split("?")[0].split("/");
              let audio_file_name = audio_url_split[audio_url_split.length - 1];

              let audio_url_current = (soundUrl ? (soundUrl && soundUrl != "" ? soundUrl : undefined) : undefined) ?? "";
              let audio_url_split_current = audio_url_current.split("?")[0].split("/");
              let audio_file_name_current = audio_url_split_current[audio_url_split_current.length - 1];

              _index++;
              return (
                <View
                  key={`${attachment.id} ${audio_url}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    // justifyContent: 'center',
                  }}
                >
                  {/* <IconButton
                    icon="play"
                    iconColor={playing ? colors.disabled : colors.primary}
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
                  <IconButton icon={!soundOnPause && audio_file_name_current == audio_file_name ? "pause" : "play"} iconColor={colors.primary} size={24} onPress={
                    () => audio_file_name_current == audio_file_name ? (soundOnPause ? playASoundOnCurrentPause() : pauseASound()) : playASound(audio_url)
                  } />
                  <View style={{ flex: 1, flexDirection: 'column' }}>
                    <View style={{ flexDirection: 'row', alignSelf: 'center' }}>
                      <Text style={{
                        color: attachment.uploaded ? colors.primary : colors.error, fontSize: 10, textAlign: 'center'
                      }}
                      >{attachment.uploaded ? t('synchronized') : t('waiting_for_synchronization')}</Text>
                      {isSyncing && audio_file_name_current == audio_file_name && <ActivityIndicator style={{}} color={colors.primary} size="small" />}
                    </View>


                    <View style={[styles_audio.container, { marginHorizontal: 20, marginTop: 0 }]}>
                      <Animated.View style={[styles_audio.bar, { width: audio_file_name_current == audio_file_name ? getProgress() ?? 0 : 0 }]} />
                    </View>
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
                  >{parseInt(String(audio_file_name_current == audio_file_name && position ? position / 1000 : 0))}</Text>
                  <IconButton
                    icon="close"
                    iconColor={colors.error}
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
          <>
            <>
              {
                attachments.map((attachment, index) => {
                  if (!attachment.isAudio) {
                    let urlL = (attachment.local_url ? (attachment.local_url && attachment.local_url != "" ? attachment.local_url : undefined) : undefined) ?? (attachment.url ?? attachment.uri);
                    return (
                      <View style={{ flex: 1, flexDirection: 'row' }}>
                        <ImageBackground
                          key={`${attachment.id} ${urlL}`}
                          source={(urlL && urlL.includes('.pdf')) ? require('../../../../../assets/pdf.png') : (
                            (urlL && urlL.includes("file://")) ? { uri: urlL } : {
                              // uri: `${couchDBURLBase}/grm_attachments/${attachment.bd_id}/${attachment.name}`,
                              // headers: {
                              //   Authorization: `Basic ${btoa(`${dbUsername}:${dbPassword}`)}`,
                              // },
                              uri: `${couchDBURLBase}${urlL}`, headers: {
                                username: dbUsername,
                                password: dbPassword,
                              }
                            }
                          )}
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
                            onPress={async () => {
                              if (!urlL.includes("file://")) {
                                setIsSyncing(true);
                                setLocalPath(null);
                                setUrl(null);
                                setUrlSyncing(urlL);
                              }
                              setLocalPath(await showDoc(attachment, dbUsername, dbPassword, false));
                              if (!urlL.includes("file://")) {
                                setUrl(attachment.url);
                                setIsSyncing(false);
                                setModalVisibleFile(true);
                                setUrlSyncing(null);
                              }

                            }}
                            style={{
                              justifyContent: 'center',
                              alignItems: 'center',
                              backgroundColor: 'rgba(255, 255, 255, 0.5)',
                            }}
                          >
                            <Image
                              resizeMode="stretch"
                              style={{ width: 20, height: 20, borderRadius: 15, marginBottom: 5 }}
                              source={require('../../../../../assets/eye.png')}
                            />
                          </TouchableOpacity>

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
                        <View style={{
                          marginHorizontal: 1,
                          alignSelf: 'flex-start',
                          justifyContent: 'flex-end',
                          marginVertical: 'auto',
                          marginLeft: 7
                        }}>
                          <Text style={{
                            color: attachment.uploaded ? colors.primary : colors.error
                          }}
                          >{attachment.uploaded ? t('synchronized') : t('waiting_for_synchronization')}</Text>
                        </View>
                        {isSyncing && urlSyncing == urlL && <ActivityIndicator style={{}} color={colors.primary} size="small" />}
                      </View>

                    )
                  }
                })
              }
            </>

            <Button
              style={{ backgroundColor: isSyncing ? colors.disabled : colors.primary, margin: 'auto', alignSelf: 'center' }}
              onPress={uploadImages}
              loading={isSyncing}
              theme={theme}
              disabled={isSyncing}
              labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
              mode="contained"
            >
              {isSyncing ? t('sync_in_progress') : t('sync_files')}
            </Button>
          </>
        }
      </View>
      <View style={{ paddingHorizontal: 50 }}>
        <Button
          theme={theme}
          disabled={!eadl || isSyncing}
          style={{ alignSelf: 'center', margin: 24, backgroundColor: isSyncing ? colors.disabled : colors.primary }}
          labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
          mode="contained"
          onPress={() => submitIssue()}
        >
          {t('submit_button_text')}
        </Button>
      </View>









      {localPath && <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisibleFile && !!localPath}
        onRequestClose={() => {
          setModalVisibleFile(!modalVisibleFile);
        }}>
        <View style={[styles.modalView, styles.modalViewPlanning]}>
          <View style={styles.modalHeader}>
            <View style={[styles.containerModalText, { flexDirection: 'row' }]}>
              <Text style={[styles.modalDetailText]}>
                {/* {localPath.split("/")[localPath.split("/").length-1]} */}
                Fichier
              </Text>
            </View>
            <View style={styles.containerModalHeaderIcon}>
              <TouchableOpacity
                onPress={() => setModalVisibleFile(false)} >
                <FontAwesome name="close" size={24} color="grey" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.conatinerFieldsPlanning}>
            <ScrollView
              nestedScrollEnabled={true}
              style={{ zIndex: 1 }}
            >


              <View style={{
                flex: 1,
                backgroundColor: '#fff',
              }}>

                {(localPath && localPath.includes('.pdf')) ? <Pdf
                  source={{ uri: `file://${localPath}`, cache: true }}
                  style={{ flex: 1 }}
                  onError={(error) => console.log('PDF error:', error)}
                /> : (<Image
                  source={{
                    uri: `file://${localPath}`, headers: {
                      username: dbUsername,
                      password: dbPassword,
                    }
                  }}
                  style={{
                    height: screenWidth * 0.8,
                    width: screenWidth * 0.8,
                    marginHorizontal: 1,
                    alignSelf: 'flex-start',
                    justifyContent: 'flex-end',
                    marginVertical: 20,
                  }}
                />)}



                {/* <Pdf source={{ uri: `file://${localPath}` }} /> */}

                {/* <WebView
                  style={{
                    flex: 1,
                  }}
                  originWhitelist={['*']}
                  allowFileAccess={true}
                  source={{ uri: `file://${localPath}` }}
                /> */}




                {/* {url && <IconButton
                    icon="download"
                    iconColor={colors.primary}
                    size={24}
                    onPress={async () => {
                      setIsSyncing(true);
                      setErrorMessage(t('starting_download'));
                      setErrorVisible(true);
                      await downloadToDownloadsFolder(url, dbUsername, dbPassword);
                      setErrorMessage(t('downloaded_file'));
                      setErrorVisible(true);
                      setIsSyncing(false);
                    }}
                  />} */}
                {localPath && url && <DownloadComponent url={url} username={dbUsername} password={dbPassword} />}

              </View>



            </ScrollView>
          </View>


        </View>
      </Modal>}

      <Snackbar visible={errorVisible} duration={1000} onDismiss={onDismissSnackBar}>
        {errorMessage}
      </Snackbar>


    </ScrollView>
  );
}

export default Content;

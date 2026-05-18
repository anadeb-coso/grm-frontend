import { AntDesign, Feather } from '@expo/vector-icons';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ImageBackground,
  ToastAndroid,
  StyleSheet,
  Animated,
  Image,
  Alert,
  ProgressBarAndroid
} from 'react-native';
import { Button, Dialog, Paragraph, Portal, TextInput, IconButton } from 'react-native-paper';
import { Audio } from 'expo-av';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Buffer } from "buffer";
import { useSelector } from 'react-redux';
import { Snackbar } from 'react-native-paper';
import NetInfo from '@react-native-community/netinfo';
// import * as Sharing from "expo-sharing";
import * as FileSystem from 'expo-file-system';
import * as Linking from 'expo-linking';
import Share from 'react-native-share';
import { colors } from '../../../../utils/colors';
import { LocalGRMDatabase, couchDBURLBase } from '../../../../utils/databaseManager';
import { styles } from './Content.styles';
import LoadingScreen from '../../../../components/LoadingScreen/LoadingScreen';
import { id_kara_centrale_cantons, administrative_levels } from '../../../../utils/utils';
import { formatDuration } from '../../../../utils/functions';
import { showDoc } from '../../../../utils/functions';
import { getEncryptedData } from '../../../../utils/storageManager';
import { baseURL } from '../../../../services/API';
import { uploadFile } from '../../../../services/upload';
import { check_issues } from '../../../../utils/functionsRequestsToApi';



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


function Content({ issue, navigation, statuses = [], eadl }) {
  const { t, i18n } = useTranslation();

  const [acceptDialog, setAcceptDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [recordStepsDialog, setRecordStepsDialog] = useState(false);
  const [escalateDialog, setEscalateDialog] = useState(false);
  const [recordResolutionDialog, setRecordResolutionDialog] = useState(false);
  const [notResolveDialog, setNotResolveDialog] = useState(false);
  const [acceptedDialog, setAcceptedDialog] = useState(false);
  const [rejectedDialog, setRejectedDialog] = useState(false);
  const [escalatedDialog, setEscalatedDialog] = useState(false);
  const [disableEscalation, setDisableEscalation] = useState(false);
  const [recordedSteps, setRecordedSteps] = useState(false);
  const [recordedResolution, setRecordedResolution] = useState(false);
  const [currentDate, setCurrentDate] = useState(moment());
  const [citizenName, setCitizenName] = useState();
  const [reason, onChangeReason] = useState('');
  const [escalateComment, onChangeEscalateComment] = useState('');
  const [comment, onChangeComment] = useState('');
  const [resolution, onChangeResolution] = useState('');
  const [notResolutionComment, onChangeNotResolutionComment] = useState('');
  const [isAcceptEnabled, setIsAcceptEnabled] = useState(false);
  const [isRecordResolutionEnabled, setIsRecordResolutionEnabled] = useState(false);
  const [isNotResolveEnabled, setIsNotResolveEnabled] = useState(false);
  const [isRateAppealEnabled, setIsRateAppealEnabled] = useState(false);
  const [isIssueAssignedToMe, setIsIssueAssignedToMe] = useState(false);
  const { username, userPassword } = useSelector((state) => state.get('authentication').toObject());
  const [dbUsername, setDBUsername] = useState(null);
  const [dbPassword, setDBPassword] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [escalateFlag, setEscalateFlag] = useState(!!issue?.escalate_flag);
  console.log(issue.escalate_flag)
  console.log(!!issue.escalate_flag)

  const [currentAdlObj, setCurrentAdlObj] = useState({
    escalate_to: {
      administrative_id: issue.administrative_region.administrative_id,
      name: issue.administrative_region.name,
      administrative_level: issue.category.administrative_level
    },
    due_at: issue.issue_date
  });
  const goToDetails = () => navigation.jumpTo('IssueDetail');
  const goToHistory = () => {
    setRecordedSteps(false);
    _hideRecordStepsDialog();
    navigation.jumpTo('History');
  };
  const _showDialog = () => setAcceptDialog(true);
  const _showEscalateDialog = () => setEscalateDialog(true);
  const _showRecordStepsDialog = () => setRecordStepsDialog(true);
  const _hideRecordStepsDialog = () => setRecordStepsDialog(false);
  const _hideEscalateDialog = () => setEscalateDialog(false);
  const _showRecordResolutionDialog = () => setRecordResolutionDialog(true);
  const _hideRecordResolutionDialog = () => setRecordResolutionDialog(false);
  const _showNotresolveDialog = () => setNotResolveDialog(true);
  const _hideNotresolveDialog = () => setNotResolveDialog(false);
  const _hideDialog = () => {
    setAcceptDialog(false);
    setAcceptedDialog(false);
  };
  const _showRejectDialog = () => {
    _hideDialog();
    setRejectDialog(true);
  };
  const _hideRejectDialog = () => setRejectDialog(false);

  const updateActionButtons = () => {
    function _isAcceptEnabled(x) {
      if ((x.initial_status || x.final_status || x.rejected_status || x.unresolved_status) && issue.category.id != 2 && isIssueAssignedToMe) {
        return issue.status?.id === x.id;
      }
    }

    function _isRecordResolutionEnabled(x) {
      if (x.open_status && isIssueAssignedToMe) {
        return issue.status?.id === x.id;
      }
    }

    function _isNotResolveEnabled(x) {
      if (!x.rejected_status && !x.final_status && !x.unresolved_status && issue.category.id != 2 && isIssueAssignedToMe) {
        return issue.status?.id === x.id;
      }
    }

    function _isRateAppealEnabled(x) {
      if (x.final_status && !isIssueAssignedToMe) {
        return issue.status?.id === x.id;
      }
    }

    if (statuses) {
      setIsAcceptEnabled(statuses.some(_isAcceptEnabled));
      setIsRecordResolutionEnabled(statuses.some(_isRecordResolutionEnabled));
      setIsNotResolveEnabled(statuses.some(_isNotResolveEnabled));
      setIsRateAppealEnabled(statuses.some(_isRateAppealEnabled));
    }
  };



  const get_next_administrative_level = (current_escalate_to) => {
    if (!current_escalate_to) {
      return "Canton";
    }
    if (current_escalate_to.administrative_level == "Canton") {
      if (current_escalate_to.administrative_id) {
        if (id_kara_centrale_cantons.includes(Number(current_escalate_to.administrative_id))) {
          return "Prefecture";
        } else {
          return "Region";
        }
      } else {
        ToastAndroid.show(`${t('error_message_for_update')}`, ToastAndroid.SHORT);
      }
    }
    try {
      return administrative_levels[administrative_levels.indexOf(current_escalate_to.administrative_level) - 1]
    } catch (e) {
      return "Country";
    }
  }

  const get_current_adl_obj = () => {
    let escalation_administrativelevels = issue.escalation_administrativelevels ?? [];

    if (escalation_administrativelevels.length != 0) {
      setCurrentAdlObj(escalation_administrativelevels[0]);
    } else {
      // setCurrentAdlObj({
      //   escalate_to: {
      //     administrative_id: issue.administrative_region.administrative_id,
      //     name: issue.administrative_region.name,
      //     administrative_level: issue.category.administrative_level
      //   },
      //   due_at: issue.issue_date
      // });
    }
  }

  useEffect(() => {
    get_current_adl_obj();
  }, []);

  useEffect(() => {
    (async () => {
      const dbConfig = await getEncryptedData(
        `dbCredentials_${userPassword}_${username.replace('@', '')}`
      );
      setDBUsername(dbConfig?.username);
      setDBPassword(dbConfig?.password);
    });
  }, []);

  //Media
  const [isLoading, setLoading] = useState(false);
  const [sound, setSound] = React.useState();
  const [soundOnPause, setSoundOnPause] = useState(false);
  const [recordingURI, setRecordingURI] = useState();
  const [recordingURIs, setRecordingURIs] = useState([]);
  const [recording, setRecording] = useState();
  const [attachments, setAttachments] = useState([]);
  const [soundUrl, setSoundUrl] = React.useState();
  const [duration, setDuration] = useState(null);
  const [position, setPosition] = useState(null);
  const [resolvePDF, setResolvePDF] = useState();
  const [escalatePDF, setEscalatePDF] = useState();


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
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, we need camera roll permissions to make this work!');
        }
      }
    })();
  }, []);

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


  const getImageDimensions = async (imageUri) => {
    return new Promise((resolve, reject) => {
      Image.getSize(
        imageUri,
        (width, height) => {
          resolve({ width, height });
        },
        (error) => {
          reject(error);
        }
      );
    });
  };

  const getImageSize = async (imageUri) => {
    let fileSizeInMB = 0;
    try {
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      const fileSizeInBytes = fileInfo.size;
      fileSizeInMB = fileSizeInBytes ? fileSizeInBytes / (1024 * 1024) : 0; // Convert bytes to MB
      // console.log('Image size:', fileSizeInMB, 'MB');
    } catch (error) {
      console.error('Error getting image size:', error);
    }
    return fileSizeInMB;
  };

  const startRecording = async () => {
    if (recordingURIs.length < 4) {
      try {
        // console.log("Requesting permissions..");
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        // console.log("Starting recording..");
        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
        await recording.startAsync();
        setRecording(recording);
        // console.log("Recording started");
      } catch (err) {
        // console.error("Failed to start recording", err);
      }
    } else {
      ToastAndroid.show(`${t('error_message_for_limit_audio')}`, ToastAndroid.SHORT);
    }
  };

  const stopRecording = async () => {
    // console.log("Stopping recording..");
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    const d = await getAudioDuration(uri);
    setRecordingURI(uri);
    setRecordingURIs([...recordingURIs, { uri: uri, duration: formatDuration(d), isAudio: true, id: new Date() }]);
    setRecording(undefined);
    // console.log("Recording stopped and stored at", uri);
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


  const playASound = async (sound_url) => {

    if (sound_url && !sound_url.includes("file://")) {
      setIsSyncing(true);
      sound_url = `file://${await showDoc({ url: sound_url }, dbUsername, dbPassword, false)}`;
      setIsSyncing(false);
    }


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

  const reomveARecordingURI = (recording_url) => {
    setSoundOnPause(false);
    if (soundUrl && recording_url == soundUrl) {
      stopASound();
    }

    setRecordingURIs(recordingURIs.filter((elt) => elt?.uri != recording_url && elt?.url != recording_url));
  }

  const getProgress = () => {
    if (
      sound === undefined || sound === null ||
      duration === undefined || duration === null ||
      position === undefined || position === null) {
      return 0;
    }

    return (position / duration) * 150;
  }

  const getAudioDuration = async (sound_url) => {
    const soundObject = new Audio.Sound();
    let durationSecond;
    try {
      // Load the audio file (replace 'your-audio-file.mp3' with your actual file)
      await soundObject.loadAsync({ uri: sound_url });

      // Get the status of the audio
      const status = await soundObject.getStatusAsync();

      // Convert the duration from milliseconds to seconds
      durationSecond = status.durationMillis / 1000;
    } catch (error) {
      console.error('Error loading audio:', error);
    } finally {
      // Unload the sound object to free up resources
      await soundObject.unloadAsync();
    }
    return durationSecond;
  };

  const get_image_manipulate = async (localUri, width, height) => {
    let manipResult;
    const imageSize = await getImageSize(localUri);

    if (!height || !width) {
      const dimensions = await getImageDimensions(localUri);
      width = width ?? dimensions.width;
      height = height ?? dimensions.height;
    }

    if (imageSize && imageSize > 1) {
      manipResult = await ImageManipulator.manipulateAsync(
        localUri,
        [{ resize: { width: width, height: height } }],
        { compress: 0.2 }//, format: ImageManipulator.SaveFormat.PNG },
      );

    } else {
      manipResult = await ImageManipulator.manipulateAsync(
        localUri,
        [{ resize: { width: width, height: height } }],
        { compress: 1, format: ImageManipulator.SaveFormat.PNG }
      );
    }
    return manipResult;
  }

  const openCamera = async () => {
    if (attachments.length < 3) {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 1,
      });

      const _result = (result.assets && result.assets.length > 0) ? result.assets[0] : result;

      let localUri = _result?.localUri || _result?.uri;
      let mimeType = _result?.mimeType;


      if (!result.canceled && localUri) {
        setLoading(true);

        let manipResult = await get_image_manipulate(
          localUri,
          (result.assets && result.assets.length > 0) ? result.assets[0].width : null,
          (result.assets && result.assets.length > 0) ? result.assets[0].height : null
        );

        setAttachments([...attachments, { ...manipResult, id: new Date(), mimeType: mimeType }]);
        // const manipResult = await ImageManipulator.manipulateAsync(
        //   result.localUri || result.uri,
        //   [{
        //     resize: {
        //       width: (result.assets && result.assets.length > 0) ? result.assets[0].width : 1000,
        //       height: (result.assets && result.assets.length > 0) ? result.assets[0].height : 1000
        //     }
        //   }],
        //   { compress: 1, format: ImageManipulator.SaveFormat.PNG }
        // );
        // setAttachments([...attachments, { ...manipResult, id: new Date() }]);
        setLoading(false);
      }
    } else {
      ToastAndroid.show(`${t('step_2_only_three_files')}`, ToastAndroid.SHORT);
    }
  };

  const pickDocument = async (hasImage = false, forResolve = false, forEscalate = false) => {
    if (attachments.length < 3) {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: hasImage ? [
            "image/*", "application/pdf"
          ] : [
            "application/pdf"
          ],
          multiple: false,
        });
        const _result = (result.assets && result.assets.length > 0) ? result.assets[0] : result;

        let localUri = _result?.localUri || _result?.uri;
        let mimeType = _result?.mimeType;

        // if (result.type != "cancel") {
        if (!result.canceled && localUri) {
          setLoading(true);

          if (forResolve) {
            setResolvePDF({ ..._result, id: new Date(), mimeType: mimeType });
          } else if (forEscalate) {
            setEscalatePDF({ ..._result, id: new Date(), mimeType: mimeType });
          } else {

            if (mimeType && mimeType.toLowerCase().includes('image')) {
              let manipResult = await get_image_manipulate(
                localUri,
                (result.assets && result.assets.length > 0) ? result.assets[0].width : null,
                (result.assets && result.assets.length > 0) ? result.assets[0].height : null
              );
              setAttachments([...attachments, { ...manipResult, id: new Date(), mimeType: mimeType }]);
            } else {
              setAttachments([...attachments, { ..._result, id: new Date(), mimeType: mimeType }]);
            }
          }

          setLoading(false);
        }

      } catch (err) {
        console.warn(err);
      }
    } else {
      ToastAndroid.show(`${t('step_2_only_three_files')}`, ToastAndroid.SHORT);
    }
  };

  const pickImage = async () => {
    pickDocument(true);
    // try {
    //   if (attachments.length < 3) {
    //     const result = await ImagePicker.launchImageLibraryAsync({
    //       presentationStyle: 0,
    //       mediaTypes: ImagePicker.MediaTypeOptions.All,
    //       allowsEditing: false,

    //       quality: 1,
    //     });
    //     if (!result.cancelled) {
    //       setLoading(true);
    //       const manipResult = await ImageManipulator.manipulateAsync(
    //         result.localUri || result.uri,
    //         [{ resize: {
    //           width: (result.assets && result.assets.length > 0) ? result.assets[0].width : 1000, 
    //           height: (result.assets && result.assets.length > 0) ? result.assets[0].height : 1000 
    //          } }],
    //         { compress: 1, format: ImageManipulator.SaveFormat.PNG }
    //       );
    //       setAttachments([...attachments, { ...manipResult, id: new Date() }]);
    //       setLoading(false);
    //     }
    //   }
    // } catch (e) {
    //   console.log(e);
    // }
  };
  function removeAttachment(index) {
    setIsSyncing(false);
    const array = [...attachments];
    array.splice(index, 1);
    setAttachments(array);
  }

  // const openUrl = url => {
  //   if (!url.includes("http")) {
  //       url = couchDBURLBase + url;
  //   }
  //   Linking.openURL(url);
  // };

  // const showDoc = async (attach) => {
  //   if (attach.uri.includes("file://")) {
  //     const buff = Buffer.from(attach.uri, "base64");
  //     const base64 = buff.toString("base64");
  //     const fileUri = FileSystem.documentDirectory + `${encodeURI(attach.name ? attach.name : "pdf")}.pdf`;

  //     await FileSystem.writeAsStringAsync(fileUri, base64, {
  //       encoding: FileSystem.EncodingType.Base64,
  //     });

  //     // Sharing.shareAsync(attach.uri);
  //     await Share.open({ url: attach.uri, });
  //   } else {
  //     openUrl(attach.uri.split("?")[0]);
  //   }


  // }

  //End Media



  const issue_status_stories = (status, coment_message) => {
    issue.issue_status_stories = issue.issue_status_stories ?? []
    issue.issue_status_stories?.unshift({
      status: { name: status.name, id: status.id },
      user: {
        id: eadl?.representative?.id,
        username: null,
        full_name: eadl?.representative?.name
      },
      comment: coment_message,
      datetime: moment()
    });
    LocalGRMDatabase.upsert(issue._id, (doc) => {
      doc = issue;
      return doc;
    })
      .then(async () => {
        //Check Issues to sync (new issues, escalade issues, assignment)
        check_issues(
          await getEncryptedData(
            `dbCredentials_${userPassword}_${username.replace('@', '')}`
          ),
          eadl, i18n.language);
      })
      .catch((err) => {
        console.log('Error', err);
      });
  };

  const acceptIssue = () => {
    const newStatus = statuses.find((x) => x.open_status === true);
    issue.comments?.unshift({
      name: issue.reporter.name,
      id: eadl.representative?.id,
      comment: (issue.status.id === 3 || issue.status.id === 4) ? t('issue_was_re_opened') : t('issue_was_accepted'),
      due_at: moment(),
    });
    saveIssueStatus(newStatus, 'accept');
    issue_status_stories(newStatus,
      `${((issue.status.id === 3 || issue.status.id === 4) ? t('issue_was_re_opened') : t('issue_was_accepted'))}\n${reason}`
    );
  };

  const rejectIssue = () => {
    const newStatus = statuses.find((x) => x.rejected_status === true);
    issue.comments?.unshift({
      name: issue.reporter.name,
      id: eadl.representative?.id,
      comment: t('issue_was_rejected'),
      due_at: moment(),
    });
    saveIssueStatus(newStatus, 'reject');
    issue_status_stories(newStatus, `${t('issue_was_rejected')}\n${reason}`);
  };


  const escalateIssue = () => {

    let current_escalate_to = null;
    issue.escalation_reasons = issue.escalation_reasons ?? [];
    issue.escalation_administrativelevels = issue.escalation_administrativelevels ?? [];
    if (issue.escalation_administrativelevels.length != 0) {
      current_escalate_to = issue.escalation_administrativelevels[0].escalate_to;
    }

    if (current_escalate_to && !current_escalate_to.administrative_id) {
      ToastAndroid.show(`${t('error_message_for_update')}`, ToastAndroid.SHORT);
    } else {
      let administrative_level_to_escalate = get_next_administrative_level(current_escalate_to);

      issue.escalate_flag = true;
      // issue.escalation_reasons = issue.escalation_reasons ?? [];
      // issue.escalation_administrativelevels = issue.escalation_administrativelevels ?? [];

      let r = null;
      let escalate_reason = {
        id: eadl?.representative?.id,
        name: eadl?.representative?.name,
        comment: escalateComment,
        due_at: moment(),
      };
      if (escalatePDF) {
        r = {
          name: escalatePDF?.uri.split('/').pop(),
          url: escalatePDF?.url ?? "",
          local_url: escalatePDF?.uri,
          id: moment(),
          uploaded: false,
          bd_id: moment(),
          user_id: eadl?.representative?.id,
          user_name: eadl?.representative?.name,
          subject: "escalation"
        };

        escalate_reason.attachment = r;

        r.type = "file";
        issue.reasons = issue.reasons ?? []
        issue.reasons?.unshift(r);

        setEscalatePDF();
      }

      issue.escalation_reasons?.unshift(escalate_reason);


      issue.comments?.unshift({
        name: issue.reporter.name,
        id: eadl.representative?.id,
        comment: `${t('issue_was_escalated')} ${t('escalate_to_label')} ${administrative_level_to_escalate == "Country" ? "Nation" : administrative_level_to_escalate}`,
        due_at: moment(),
      });


      issue.escalation_administrativelevels?.unshift({
        escalate_to: {
          administrative_level: administrative_level_to_escalate
        },
        due_at: moment()
      });

      saveIssueStatus();
      setDisableEscalation(true);
      setEscalatedDialog(true);

      const newStatus = statuses.find((x) => x.id === issue.status.id);
      issue_status_stories(newStatus, `${t('issue_was_escalated')}\n${escalateComment}`);

      get_current_adl_obj();

      setEscalateFlag(issue.escalate_flag);
    }
  };

  const recordStep = () => {
    let due_at = moment();
    issue.comments?.unshift({
      name: issue.reporter.name,
      id: eadl.representative?.id,
      comment,
      due_at: due_at,
    });

    issue.reasons = issue.reasons ?? []
    issue.reasons?.unshift({
      user_name: eadl?.representative?.name,
      user_id: eadl?.representative?.id,
      comment: comment,
      due_at: due_at,
      id: moment(),
      type: "comment",
      comment_id: due_at,
    });

    for (let i = 0; i < attachments.length; i++) {
      issue.reasons?.unshift({
        name: attachments[i]?.uri.split('/').pop(),
        url: attachments[i]?.url ?? "",
        local_url: attachments[i]?.uri,
        id: moment(),
        uploaded: false,
        bd_id: due_at,
        type: "file",
        user_id: eadl?.representative?.id,
        user_name: eadl?.representative?.name,
        comment_id: due_at
      });
    }
    setAttachments([]);
    for (let index = 0; index < recordingURIs.length; index++) {
      issue.reasons?.unshift({
        name: recordingURIs[index].uri.split('/').pop(),
        url: recordingURIs[index].url ?? "",
        local_url: recordingURIs[index].uri,
        id: moment(),
        uploaded: false,
        bd_id: due_at,
        type: "file",
        user_id: eadl?.representative?.id,
        user_name: eadl?.representative?.name,
        isAudio: true,
        comment_id: due_at
      });
    }
    setRecordingURIs([]);

    if (recordingURI) {
      setRecordingURI();
    }


    saveIssueStatus();
    setRecordedSteps(true);

    const newStatus = statuses.find((x) => x.id === issue.status.id);
    issue_status_stories(newStatus, comment);
  };

  const recordResolution = () => {
    setRecordedResolution(true);
  };

  const recordResolutionConfirmation = () => {
    issue.research_result = resolution;
    const newStatus = statuses.find((x) => x.final_status === true);
    issue.comments?.unshift({
      name: issue.reporter.name,
      id: eadl.representative?.id,
      comment: t('issue_was_resolved'),
      due_at: moment(),
    });


    if (resolvePDF) {
      let r = {
        name: resolvePDF?.uri.split('/').pop(),
        url: resolvePDF?.url ?? "",
        local_url: resolvePDF?.uri,
        id: moment(),
        uploaded: false,
        bd_id: moment(),
        type: "file",
        user_id: eadl?.representative?.id,
        user_name: eadl?.representative?.name,
        subject: "resolution"
      };

      issue.reasons = issue.reasons ?? []
      issue.reasons?.unshift(r);

      issue.resolution_files = issue.resolution_files ?? [];
      issue.resolution_files?.unshift(r);

      setResolvePDF();
    }

    saveIssueStatus(newStatus, 'record_resolution');
    _hideRecordResolutionDialog();
    issue_status_stories(newStatus, `${t('issue_was_resolved')}\n${resolution}`);
  };

  const notResolve = () => {
    issue.unresolved_reason = notResolutionComment;
    issue.unresolved_date = moment();
    const newStatus = statuses.find((x) => x.unresolved_status === true);
    issue.comments?.unshift({
      name: issue.reporter.name,
      id: eadl.representative?.id,
      comment: t('issue_was_not_resolved'),
      due_at: moment(),
    });
    saveIssueStatus(newStatus, 'not_resolve');
    _hideNotresolveDialog();
    issue_status_stories(newStatus, `${t('issue_was_not_resolved')}\n${notResolutionComment}`);
  };

  const saveIssueStatus = (newStatus, type = 'none') => {
    if (newStatus) {
      issue.status = {
        id: newStatus.id,
        name: newStatus.name,
      };
    }
    if (type === 'rejected') {
      issue.reject_reason = reason;
    }
    LocalGRMDatabase.upsert(issue._id, (doc) => {
      doc = issue;
      return doc;
    })
      .then(async () => {
        updateActionButtons();
        if (type === 'accept') {
          setAcceptedDialog(true);
        } else if (type === 'reject') {
          setRejectedDialog(true);
        } else if (type === 'record_resolution') {
          setRecordedResolution(false);
          _hideRecordResolutionDialog();
        } else if (type == 'not_resolve') {
          setNotResolveDialog(false);
          _hideNotresolveDialog();
        }

        //Check Issues to sync (new issues, escalade issues, assignment)
        check_issues(
          await getEncryptedData(
            `dbCredentials_${userPassword}_${username.replace('@', '')}`
          ),
          eadl, i18n.language);

      })
      .catch((err) => {
        console.log('Error', err);
      });
  };

  useEffect(() => {
    function _isIssueAssignedToMe() {
      if (issue.assignee && issue.assignee.id) {
        // return issue.reporter.id === issue.assignee.id;
        return issue.assignee.id === eadl.representative?.id;
      }
    }
    setIsIssueAssignedToMe(_isIssueAssignedToMe());

    if (issue.citizen_type !== 1) {
      setCitizenName(issue.citizen);
    } else if (issue.citizen_type === 1) {
      setCitizenName(_isIssueAssignedToMe() ? issue.citizen : 'Anonymous');
    }
  }, []);

  useEffect(() => {
    updateActionButtons();
  }, [statuses, issue]);


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
  const uploadImages = async () => {

    setConnected(true);
    check_network();
    if (connected) {
      setIsSyncing(true);

      try {
        let count = 0;
        let elt_id;
        let attachments_recordingURIs_pdfs = [...attachments, ...recordingURIs, escalatePDF, resolvePDF];

        const updatedAttachments = [...attachments_recordingURIs_pdfs];
        for (let i = 0; i < attachments_recordingURIs_pdfs.length; i++) {
          let elt = attachments_recordingURIs_pdfs[i];

          if (elt && elt?.uri && elt?.uri && elt?.uri.includes("file://") && !elt.uploaded) {
            try {
              const response = await uploadFile(
                `${baseURL}/attachments/upload-to-issue`,
                {

                  username: dbUsername,
                  password: dbPassword,
                  url: elt?.uri,
                  isAudio: elt?.isAudio,
                  mimeType: elt?.mimeType
                }
              );

              if (response.fileUrl) {
                elt_id = updatedAttachments.findIndex((e, i) => e && e.id == elt.id);
                elt.url_uploaded = response.fileUrl;
                updatedAttachments[elt_id] = {
                  ...updatedAttachments[elt_id],
                  uploaded: true,
                  bd_id: response.bd_id,
                  url: response.fileUrl,
                  uri: '',
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

          setAttachments(updatedAttachments.slice(0, attachments.length));

          setRecordingURIs(updatedAttachments.slice(attachments.length, updatedAttachments.length - [...[escalatePDF], ...[resolvePDF]].length));
          let _escalatePDFs = updatedAttachments.slice(attachments.length + recordingURIs.length, updatedAttachments.length - [...[resolvePDF]].length);
          setEscalatePDF(_escalatePDFs.length == 0 ? null : _escalatePDFs[0]);
          let _resolvePDFs = updatedAttachments.slice(attachments.length + recordingURIs.length + [...[escalatePDF]].length, updatedAttachments.length);
          setResolvePDF(_resolvePDFs.length == 0 ? null : _resolvePDFs[0]);

          if (count == 1) {
            ToastAndroid.show(`${t('attachment_synchronized')}`, ToastAndroid.SHORT);
          } else {
            ToastAndroid.show(`${t('attachments_synchronized')}`, ToastAndroid.SHORT);
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


  return (
    <ScrollView>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'position' : null}>
        <View style={{ padding: 23 }}>
          <Text style={styles.stepDescription}>
            {citizenName ? `${citizenName}, ` : ''} {issue.intake_date && moment(issue.intake_date).format('DD-MMM-YYYY')}{' '}
            {issue.intake_date && currentDate.diff(issue.intake_date, 'days')} {t('days_ago')}
          </Text>
          <Text style={styles.stepDescription}>
            {t('status_label')}: <Text style={{ color: colors.primary }}>{issue.status?.name}</Text>
          </Text>
          <Text style={styles.stepDescription}>
            {t('level_label')}: <Text style={{ color: colors.primary }}>{
              currentAdlObj.escalate_to.administrative_level == "Country" ? "Nation" : currentAdlObj.escalate_to.administrative_level
            }</Text>
          </Text>
          <Text style={styles.stepNote}>{issue.description?.substring(0, 170)}</Text>
          <View style={{ paddingHorizontal: 50 }}>
            <Button
              theme={theme}
              style={{ alignSelf: 'center', margin: 24 }}
              labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
              mode="contained"
              onPress={goToDetails}
            >
              {t('view_details')}
            </Button>
          </View>

          {/* ACTION BUTTONS */}
          <View
            style={{ borderWidth: 1, borderRadius: 15, padding: 15, borderColor: colors.lightgray }}
          >
            <TouchableOpacity
              onPress={() => _showDialog()}
              disabled={!isAcceptEnabled || escalateFlag}
              style={{
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginVertical: 10,
              }}
            >
              <Text style={styles.subtitle}>{([3, 4, 5].includes(issue.status.id)) ? t('re_open_issue') : t('accept_issue')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AntDesign
                  style={{ marginRight: 5 }}
                  name="rightsquare"
                  size={35}
                  color={(isAcceptEnabled && !escalateFlag) ? colors.primary : colors.disabled}
                />
                <Feather name="help-circle" size={24} color="gray" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={_showRecordStepsDialog}
              disabled={!isRecordResolutionEnabled}
              style={{
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginVertical: 10,
              }}
            >
              <Text ellipsizeMode="tail" numberOfLines={1} style={styles.subtitle}>
                {t('record_steps_taken').substring(0, 28)}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AntDesign
                  style={{ marginRight: 5 }}
                  name="rightsquare"
                  size={35}
                  color={isRecordResolutionEnabled ? colors.primary : colors.disabled}
                />
                <Feather name="help-circle" size={24} color="gray" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={_showRecordResolutionDialog}
              disabled={!isRecordResolutionEnabled}
              style={{
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginVertical: 10,
              }}
            >
              <Text style={styles.subtitle}>{t('record_resolution')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AntDesign
                  style={{ marginRight: 5 }}
                  name="rightsquare"
                  size={35}
                  color={isRecordResolutionEnabled ? colors.primary : colors.disabled}
                />
                <Feather name="help-circle" size={24} color="gray" />
              </View>
            </TouchableOpacity>

            {/* Not resolve */}
            <TouchableOpacity
              onPress={_showNotresolveDialog}
              disabled={!isNotResolveEnabled}
              style={{
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginVertical: 10,
              }}
            >
              <Text style={styles.subtitle}>{t('record_not_resolve')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AntDesign
                  style={{ marginRight: 5 }}
                  name="rightsquare"
                  size={35}
                  color={isNotResolveEnabled ? colors.primary : colors.disabled}
                />
                <Feather name="help-circle" size={24} color="gray" />
              </View>
            </TouchableOpacity>
            {/* End Not resolve */}

            {/* <TouchableOpacity
              disabled={!isRateAppealEnabled}
              style={{
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginVertical: 10,
              }}
            >
              <Text style={styles.subtitle}>{t('rate_appeal')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AntDesign
                  style={{ marginRight: 5 }}
                  name="rightsquare"
                  size={35}
                  color={isRateAppealEnabled ? colors.primary : colors.disabled}
                />
                <Feather name="help-circle" size={24} color="gray" />
              </View>
            </TouchableOpacity> */}
          </View>
          <TouchableOpacity
            onPress={_showEscalateDialog}
            // disabled={disableEscalation || !isRecordResolutionEnabled || escalateFlag}
            disabled={!issue.status.id == 5 || currentAdlObj.escalate_to.administrative_level == "Country" || (!issue.status.id == 5 && escalateFlag)}
            style={{
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginVertical: 10,
              padding: 15,
            }}
          >
            <Text style={styles.subtitle}>{t('escalate')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AntDesign
                style={{ marginRight: 5 }}
                name="rightsquare"
                size={35}
                // color={!disableEscalation && isRecordResolutionEnabled ? colors.primary : colors.disabled}
                color={((issue.status.id == 5 && currentAdlObj.escalate_to.administrative_level != "Country" && !escalateFlag)) ? colors.primary : colors.disabled}
              />
              <Feather name="help-circle" size={24} color="gray" />
            </View>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* REJECT MODAL */}
      <Portal>
        <Dialog visible={rejectDialog} onDismiss={_hideRejectDialog}>
          <Dialog.Content>
            {!rejectedDialog ? (
              <Paragraph>{t('you_are_rejecting')}</Paragraph>
            ) : (
              <Paragraph>{t('complaint_rejected')}</Paragraph>
            )}
            {!rejectedDialog && (
              <TextInput
                multiline
                style={{ marginTop: 10 }}
                mode="outlined"
                theme={theme}
                onChangeText={onChangeReason}
              />
            )}
          </Dialog.Content>
          {!rejectedDialog ? (
            <Dialog.Actions>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', backgroundColor: '#d4d4d4' }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={_hideRejectDialog}
              >
                {t('cancel')}
              </Button>
              <Button
                disabled={reason === ''}
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={rejectIssue}
              >
                {t('submit')}
              </Button>
            </Dialog.Actions>
          ) : (
            <Dialog.Actions>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={_hideRejectDialog}
              >
                {t('finished')}
              </Button>
            </Dialog.Actions>
          )}
        </Dialog>
      </Portal>

      {/* ACCEPT MODAL */}
      <Portal>
        <Dialog visible={acceptDialog} onDismiss={_hideDialog}>
          {!acceptedDialog && <Dialog.Title>{([3, 4, 5].includes(issue.status.id)) ? (t('re_open_issue') + " ?") : (t('accept_issue') + "?")}</Dialog.Title>}
          <Dialog.Content>
            {!acceptedDialog ? (
              <Paragraph>{t('are_you_accepting')}</Paragraph>
            ) : (
              <Paragraph>{t('you_have_accepted')}</Paragraph>
            )}
          </Dialog.Content>
          {!acceptedDialog ? (
            <Dialog.Actions>
              {/* {
                (issue.status.id === 3 || issue.status.id === 4) 
                  ? 
                    <></>
                  : 
                    <Button
                      theme={theme}
                      style={{ alignSelf: 'center', backgroundColor: '#d4d4d4' }}
                      labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                      mode="contained"
                      onPress={_showRejectDialog}
                    >
                      {t('reject')}
                    </Button>
                } */}
              <Button
                theme={theme}
                style={{ alignSelf: 'center', backgroundColor: '#d4d4d4' }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={_hideDialog}
              >
                {t('cancel')}
              </Button>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={acceptIssue}
              >
                {([3, 4, 5].includes(issue.status.id)) ? t('re_open_issue') : t('accept')}
              </Button>
            </Dialog.Actions>
          ) : (
            <Dialog.Actions>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={_hideDialog}
              >
                {t('finished')}
              </Button>
            </Dialog.Actions>
          )}
        </Dialog>
      </Portal>

      {/* ESCALATE MODAL */}
      <Portal>
        <Dialog visible={escalateDialog} onDismiss={_hideEscalateDialog}>
          <Dialog.Content>
            {!escalatedDialog ? (
              <Paragraph>{t('you_are_escalating')}</Paragraph>
            ) : (
              <Paragraph>{t('escalated_text')}</Paragraph>
            )}
            {!escalatedDialog && (
              <>
                <TextInput
                  multiline
                  style={{ marginTop: 10 }}
                  mode="outlined"
                  theme={theme}
                  placeholder={t('comment_placeholder')}
                  onChangeText={onChangeEscalateComment}
                />

                <View style={{ paddingHorizontal: 5 }}>
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
                    {t('step_2_share_pv_escalate')}
                  </Text>
                  <View style={{ flexDirection: 'row' }}>
                    {escalatePDF && (
                      <ImageBackground
                        key={escalatePDF.id}
                        source={escalatePDF.mimeType && escalatePDF.mimeType.includes('pdf') ? require('../../../../../assets/pdf.png') : { uri: attachment.uri }}
                        style={{
                          height: 80,
                          width: 80,
                          marginHorizontal: 1,
                          alignSelf: 'center',
                          justifyContent: 'flex-end',
                          marginVertical: 20,
                        }}
                      >
                        {escalatePDF.mimeType && escalatePDF.mimeType.includes('pdf') ? <TouchableOpacity
                          onPress={async () => { await showDoc(escalatePDF, dbUsername, dbPassword) }}
                          style={{
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: 60,
                            backgroundColor: 'rgba(255, 255, 255, 0.5)',
                          }}
                        >
                          <Image
                            resizeMode="stretch"
                            style={{ width: 30, height: 30, borderRadius: 50 }}
                            source={require('../../../../../assets/eye.png')}
                          />
                        </TouchableOpacity> : <></>}
                        <TouchableOpacity
                          onPress={() => { setEscalatePDF() }}
                          style={{
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: 20,
                            backgroundColor: escalatePDF.uploaded ? colors.primary : 'rgba(255, 1, 1, 1)',
                          }}
                        >
                          <Text style={{ color: escalatePDF.uploaded ? 'rgba(255, 1, 1, 1)' : 'white' }}>X</Text>
                        </TouchableOpacity>
                      </ImageBackground>
                    )}
                  </View>

                  {isSyncing && <View>
                    <ProgressBarAndroid styleAttr="Horizontal" color="primary.500" key={"task_progress_key"} />
                  </View>}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                    }}
                  >
                    <IconButton
                      icon="sync"
                      iconColor={colors.lightgray}
                      style={{ backgroundColor: isSyncing ? colors.disabled : colors.primary, margin: 'auto', alignSelf: 'center', marginRight: 25 }}
                      onPress={uploadImages}
                      loading={isSyncing}
                      theme={theme}
                      disabled={isSyncing || !(escalatePDF)}
                      labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                      mode="contained"
                    />

                    <Button
                      theme={theme}
                      disabled={isSyncing}
                      style={{ alignSelf: 'center' }}
                      labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                      mode="contained"
                      onPress={() => { pickDocument(false, false, true) }}
                      uppercase={false}
                    >
                      {t('attach_pv')}
                    </Button>
                  </View>
                </View>

              </>
            )}
          </Dialog.Content>
          {!escalatedDialog ? (
            <Dialog.Actions>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', backgroundColor: '#d4d4d4' }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={_hideEscalateDialog}
              >
                {t('cancel')}
              </Button>
              <Button
                disabled={escalateComment === '' || !(escalatePDF)}
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={escalateIssue}
              >
                {t('submit')}
              </Button>
            </Dialog.Actions>
          ) : (
            <Dialog.Actions>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={() => {
                  _hideEscalateDialog();
                  setEscalatedDialog(false);
                }}
              >
                {t('finished')}
              </Button>
            </Dialog.Actions>
          )}
        </Dialog>
      </Portal>

      {/* RECORD STEPS MODAL */}
      <Portal>
        <Dialog visible={recordStepsDialog} onDismiss={_hideRecordStepsDialog}>
          <Dialog.Content>
            {!recordedSteps ? (
              <Paragraph>{t('record_steps_text')}</Paragraph>
            ) : (
              <Paragraph>{t('recorded_comment')}</Paragraph>
            )}
            {!recordedSteps && (
              <>
                <TextInput
                  multiline
                  style={{ marginTop: 10 }}
                  mode="outlined"
                  theme={theme}
                  onChangeText={onChangeComment}
                />

                <View style={{ paddingHorizontal: 5 }}>
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
                    {t('step_2_share_photos')}
                  </Text>
                  <View style={{ flexDirection: 'row' }}>
                    {attachments.length > 0 &&
                      attachments.map((attachment, index) => {
                        let urlL = (attachment.local_url ? (attachment.local_url && attachment.local_url != "" ? attachment.local_url : undefined) : undefined) ?? (attachment.url ?? attachment.uri);

                        return (
                          <ImageBackground
                            key={`${attachment.id}_${urlL}`}
                            // source={attachment.mimeType && attachment.mimeType.includes('pdf') ? require('../../../../../assets/pdf.png') : { uri: attachment.uri }}
                            source={(urlL && urlL.includes('.pdf')) ? require('../../../../../assets/pdf.png') : (
                              (urlL && urlL.includes("file://")) ? { uri: urlL } : {
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
                              alignSelf: 'center',
                              justifyContent: 'flex-end',
                              marginVertical: 20,
                            }}
                          >
                            {/* {attachment.mimeType && attachment.mimeType.includes('pdf') ?  */}
                            <TouchableOpacity
                              onPress={async () => { await showDoc(attachment, dbUsername, dbPassword) }}
                              style={{
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: 60,
                                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                              }}
                            >
                              <Image
                                resizeMode="stretch"
                                style={{ width: 30, height: 30, borderRadius: 50 }}
                                source={require('../../../../../assets/eye.png')}
                              />
                            </TouchableOpacity>
                            {/* : <></>} */}
                            <TouchableOpacity
                              onPress={() => removeAttachment(index)}
                              style={{
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: 20,
                                backgroundColor: attachment.uploaded ? colors.primary : 'rgba(255, 1, 1, 1)',
                              }}
                            >
                              <Text style={{ color: attachment.uploaded ? 'rgba(255, 1, 1, 1)' : 'white' }}>X</Text>
                            </TouchableOpacity>
                          </ImageBackground>
                        )
                      })}
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Button
                      theme={theme}
                      style={{ alignSelf: 'center' }}
                      labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                      mode="contained"
                      onPress={pickImage}
                      uppercase={false}
                    >
                      {t('step_2_upload_attachment')}
                    </Button>
                    <View style={styles.iconButtonStyle}>
                      <IconButton icon="camera" iconColor={colors.primary} size={24} onPress={openCamera} />
                    </View>
                    <View style={styles.iconButtonStyle}>
                      <IconButton
                        icon={recording ? 'record-circle-outline' : 'microphone'}
                        iconColor={recording ? '#f80102' : colors.primary}
                        size={24}
                        onPress={recording ? stopRecording : startRecording}
                      />
                    </View>
                  </View>
                </View>
                {/* {recordingURI && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconButton icon="play" color={colors.primary} size={24} onPress={playSound} />
            <Text
              style={{
                fontFamily: 'Poppins_400Regular',
                fontSize: 12,
                fontWeight: 'normal',
                fontStyle: 'normal',
                lineHeight: 18,
                letterSpacing: 0,
                textAlign: 'left',
                iconColor: '#707070',
                marginVertical: 13,
              }}
            >
              {t('play_recorded_audio')}
            </Text>
            <IconButton
              icon="close"
              iconColor={colors.error}
              size={24}
              onPress={() => setRecordingURI()}
            />
          </View>
        )} */}
                {recordingURIs && recordingURIs.map((recording_url, index) => {
                  let audio_url = (recording_url.local_url ? (recording_url.local_url && recording_url.local_url != "" ? recording_url.local_url : undefined) : undefined) ?? (recording_url.url ?? recording_url.uri);
                  let audio_url_split = audio_url.split("?")[0].split("/");
                  let audio_file_name = audio_url_split[audio_url_split.length - 1];

                  let audio_url_current = (soundUrl ? (soundUrl && soundUrl != "" ? soundUrl : undefined) : undefined) ?? "";
                  let audio_url_split_current = audio_url_current.split("?")[0].split("/");
                  let audio_file_name_current = audio_url_split_current[audio_url_split_current.length - 1];

                  return (
                    <View
                      key={audio_url}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconButton icon={!soundOnPause && audio_file_name_current == audio_file_name ? "pause" : "play"} iconColor={recording_url.uploaded ? colors.primary : colors.error} size={24} onPress={
                        () => audio_file_name_current == audio_file_name ? (soundOnPause ? playASoundOnCurrentPause() : pauseASound()) : playASound(audio_url)
                      } />
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
                      >{recording_url.duration}</Text>
                      <View style={styles_audio.container}>
                        <Animated.View style={[styles_audio.bar, { width: audio_file_name_current == audio_file_name ? getProgress() ?? 0 : 0 }]} />
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
                        {`(${index + 1})`}
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
                        onPress={() => reomveARecordingURI(audio_url)}
                      />
                    </View>
                  )
                })}




              </>
            )}
            {isSyncing && <View>
              <ProgressBarAndroid styleAttr="Horizontal" color="primary.500" key={"task_progress_key_1"} />
            </View>}
          </Dialog.Content>
          {!recordedSteps ? (
            <Dialog.Actions>
              <IconButton
                icon="sync"
                iconColor={colors.lightgray}
                style={{ backgroundColor: (isSyncing || !(recordingURIs.length != 0 || attachments.length != 0)) ? colors.disabled : colors.primary, margin: 'auto', alignSelf: 'center', marginRight: 25 }}
                onPress={uploadImages}
                loading={isSyncing}
                theme={theme}
                disabled={isSyncing || !(recordingURIs.length != 0 || attachments.length != 0)}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
              />
              {/* {isSyncing ? t('sync_in_progress') : t('sync_files')}
              </Button> */}

              <Button
                theme={theme}
                style={{ alignSelf: 'center', backgroundColor: '#d4d4d4' }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={_hideRecordStepsDialog}
              >
                {t('cancel')}
              </Button>
              <Button
                disabled={comment === ''}
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={recordStep}
              >
                {t('submit')}
              </Button>
            </Dialog.Actions>
          ) : (
            <Dialog.Actions>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={() => {
                  _hideRecordStepsDialog();
                  setRecordedSteps(false);
                }}
              >
                {t('finished')}
              </Button>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={goToHistory}
              >
                {t('view_history')}
              </Button>
            </Dialog.Actions>
          )}
        </Dialog>
      </Portal>

      <Portal>
        <Dialog visible={recordResolutionDialog} onDismiss={_hideRecordResolutionDialog}>
          <Dialog.Content>
            {!recordedResolution ? (
              <Paragraph>{t('summarize_resolution')}</Paragraph>
            ) : (
              <Paragraph>{t('please_confirm_resolution')}</Paragraph>
            )}
            {!recordedResolution ? (
              <>
                <TextInput
                  multiline
                  style={{ marginTop: 10 }}
                  mode="outlined"
                  theme={theme}
                  placeholder={t('comment_placeholder')}
                  onChangeText={onChangeResolution}
                />

                <View style={{ paddingHorizontal: 5 }}>
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
                    {t('step_2_share_pv')}
                  </Text>
                  <View style={{ flexDirection: 'row' }}>
                    {resolvePDF && (
                      <ImageBackground
                        key={resolvePDF.id}
                        source={resolvePDF.mimeType && resolvePDF.mimeType.includes('pdf') ? require('../../../../../assets/pdf.png') : { uri: attachment.uri }}
                        style={{
                          height: 80,
                          width: 80,
                          marginHorizontal: 1,
                          alignSelf: 'center',
                          justifyContent: 'flex-end',
                          marginVertical: 20,
                        }}
                      >
                        {resolvePDF.mimeType && resolvePDF.mimeType.includes('pdf') ? <TouchableOpacity
                          onPress={async () => { await showDoc(resolvePDF, dbUsername, dbPassword) }}
                          style={{
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: 60,
                            backgroundColor: 'rgba(255, 255, 255, 0.5)',
                          }}
                        >
                          <Image
                            resizeMode="stretch"
                            style={{ width: 30, height: 30, borderRadius: 50 }}
                            source={require('../../../../../assets/eye.png')}
                          />
                        </TouchableOpacity> : <></>}
                        <TouchableOpacity
                          onPress={() => { setResolvePDF() }}
                          style={{
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: 20,
                            backgroundColor: resolvePDF.uploaded ? colors.primary : 'rgba(255, 1, 1, 1)',
                          }}
                        >
                          <Text style={{ color: resolvePDF.uploaded ? 'rgba(255, 1, 1, 1)' : 'white' }}>X</Text>
                        </TouchableOpacity>
                      </ImageBackground>
                    )}
                  </View>
                  {isSyncing && <View>
                    <ProgressBarAndroid styleAttr="Horizontal" color="primary.500" key={"task_progress_key_2"} />
                  </View>}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                    }}
                  >
                    <IconButton
                      icon="sync"
                      iconColor={colors.lightgray}
                      style={{ backgroundColor: isSyncing ? colors.disabled : colors.primary, margin: 'auto', alignSelf: 'center', marginRight: 25 }}
                      onPress={uploadImages}
                      loading={isSyncing}
                      theme={theme}
                      disabled={isSyncing || !(resolvePDF)}
                      labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                      mode="contained"
                    />

                    <Button
                      theme={theme}
                      disabled={isSyncing}
                      style={{ alignSelf: 'center' }}
                      labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                      mode="contained"
                      onPress={() => { pickDocument(false, true) }}
                      uppercase={false}
                    >
                      {t('attach_pv')}
                    </Button>
                  </View>
                </View>

              </>
            ) : (
              <Text>
                {'\n'}"{resolution}"
              </Text>
            )}
          </Dialog.Content>
          {!recordedResolution ? (
            <Dialog.Actions>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', backgroundColor: '#d4d4d4' }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={() => {
                  _hideRecordStepsDialog();
                  _hideRecordResolutionDialog();
                }}
              >
                {t('cancel')}
              </Button>
              <Button
                disabled={resolution === '' || !(resolvePDF)}
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={recordResolution}
              >
                {t('submit')}
              </Button>
            </Dialog.Actions>
          ) : (
            <Dialog.Actions>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', backgroundColor: '#d4d4d4' }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={() => {
                  setRecordedResolution(false);
                  _hideRecordResolutionDialog();
                }}
              >
                {t('cancel')}
              </Button>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={recordResolutionConfirmation}
              >
                {t('confirm')}
              </Button>
            </Dialog.Actions>
          )}
        </Dialog>
      </Portal>

      {/* Dialog NOt resolve */}
      <Portal>
        <Dialog visible={notResolveDialog} onDismiss={_hideNotresolveDialog}>
          <Dialog.Content>

            <Paragraph>{t('record_not_resolve')}</Paragraph>

            <TextInput
              multiline
              style={{ marginTop: 10 }}
              mode="outlined"
              theme={theme}
              placeholder={t('comment_placeholder')}
              onChangeText={onChangeNotResolutionComment}
            />

          </Dialog.Content>

          <Dialog.Actions>
            <Button
              theme={theme}
              style={{ alignSelf: 'center', backgroundColor: '#d4d4d4' }}
              labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
              mode="contained"
              onPress={_hideNotresolveDialog}
            >
              {t('cancel')}
            </Button>
            <Button
              disabled={notResolutionComment === ''}
              theme={theme}
              style={{ alignSelf: 'center', margin: 24 }}
              labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
              mode="contained"
              onPress={notResolve}
            >
              {t('submit')}
            </Button>
          </Dialog.Actions>

        </Dialog>
      </Portal>
      {/* Dialog NOt resolve */}

      <Snackbar visible={errorVisible} duration={1000} onDismiss={onDismissSnackBar}>
        {errorMessage}
      </Snackbar>

      <LoadingScreen visible={isLoading} />
    </ScrollView>
  );
}

export default Content;

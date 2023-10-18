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
} from 'react-native';
import { Button, Dialog, Paragraph, Portal, TextInput, IconButton } from 'react-native-paper';
import { Audio } from 'expo-av';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Buffer } from "buffer";
import * as Sharing from "expo-sharing";
import * as FileSystem from 'expo-file-system';
import * as Linking from 'expo-linking';
import { colors } from '../../../../utils/colors';
import { LocalGRMDatabase } from '../../../../utils/databaseManager';
import { styles } from './Content.styles';
import LoadingScreen from '../../../../components/LoadingScreen/LoadingScreen';
import { id_kara_centrale_cantons, administrative_levels } from '../../../../utils/utils';


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
  const { t } = useTranslation();

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
    if(!current_escalate_to){
      return "Canton";
    }
    if(current_escalate_to.administrative_level == "Canton"){
      if(current_escalate_to.administrative_id){
        if(id_kara_centrale_cantons.includes(Number(current_escalate_to.administrative_id))){
          return "Prefecture";
        }else{
          return "Region";
        }
      }else{
        ToastAndroid.show(`${t('error_message_for_update')}`, ToastAndroid.SHORT);
      }
    }
    try{
      return administrative_levels[administrative_levels.indexOf(current_escalate_to.administrative_level) - 1]
    }catch(e){
      return "Country";
    }
  }

  const get_current_adl_obj = () => {
    let escalation_administrativelevels = issue.escalation_administrativelevels ?? [];
    
    if(escalation_administrativelevels.length != 0){
      setCurrentAdlObj(escalation_administrativelevels[0]);
    }else{
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

  //Media
  const [isLoading, setLoading] = useState(false);
  const [sound, setSound] = React.useState();
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


  
  const startRecording = async () => {
    if (recordingURIs.length < 4){
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
    }else{
      ToastAndroid.show(`${t('error_message_for_limit_audio')}`, ToastAndroid.SHORT);
    }
  };

  const stopRecording = async () => {
    // console.log("Stopping recording..");
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecordingURI(uri);
    setRecordingURIs([...recordingURIs, uri]);
    setRecording(undefined);
    // console.log("Recording stopped and stored at", uri);
  };

  const onPlaybackStatusUpdate = (status) => {
    setDuration(status.durationMillis);
    setPosition(status.positionMillis);
    // setFinish(status.didJustFinish);

    if(status.didJustFinish){
      setSound(undefined);
      setSoundUrl(undefined);
    }
}


const playASound = async (sound_url) => {
  // console.log("Loading Sound");
  
  const { sound } = await Audio.Sound.createAsync(
    { uri: sound_url },
    { shouldPlay: true },
    onPlaybackStatusUpdate
  );
  setSound(sound);
  setSoundUrl(recordingURI);
  // console.log("Playing Sound");
  await sound.playAsync();
};

const stopASound = async () => {
  await sound.stopAsync();
  setSound(undefined);
  setSoundUrl(undefined);
};

const reomveARecordingURI = (recording_url) => {
  if(soundUrl && recording_url == soundUrl){
    stopASound();
  }
  
  setRecordingURIs(recordingURIs.filter((elt) => elt != recording_url));
}

const getProgress = () => {
  if (sound === undefined || sound === null || duration === null || position === null) {
      return 0;
  }

  return (position / duration) * 150;
}


  const openCamera = async () => {
    if (attachments.length < 3) {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.cancelled) {
        setLoading(true);
        const manipResult = await ImageManipulator.manipulateAsync(
          result.localUri || result.uri,
          [{ resize: { 
            width: (result.assets && result.assets.length > 0) ? result.assets[0].width : 1000, 
            height: (result.assets && result.assets.length > 0) ? result.assets[0].height : 1000 
          } 
          }],
          { compress: 1, format: ImageManipulator.SaveFormat.PNG }
        );
        setAttachments([...attachments, { ...manipResult, id: new Date() }]);
        setLoading(false);
      }
    }
  };

  const pickDocument = async (hasImage = false, forResolve = false, forEscalate = false) => {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: hasImage ? [
            "image/*", "application/pdf"
          ] : [
            "application/pdf"
          ],
          multiple: false,
        });
        
        if(result.type != "cancel"){
          setLoading(true);

          if(forResolve){
            setResolvePDF({ ...result, id: new Date() });
          }else if(forEscalate){
            setEscalatePDF({ ...result, id: new Date() });
          }else{
            setAttachments([...attachments, { ...result, id: new Date() }]);
          }
          
          setLoading(false);
        }
        
      } catch (err) {
        console.warn(err);
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
    const array = [...attachments];
    array.splice(index, 1);
    setAttachments(array);
  }

  const openUrl = url => {
    Linking.openURL(url);
  };

  const showDoc = async (attach) => {
    if(attach.uri.includes("file://")){
      const buff = Buffer.from(attach.uri, "base64");
      const base64 = buff.toString("base64");
      const fileUri = FileSystem.documentDirectory + `${encodeURI(attach.name ? attach.name : "pdf")}.pdf`;
      
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
  
      Sharing.shareAsync(attach.uri);
      
    }else{
      openUrl(attach.uri.split("?")[0]);
    }
    

  }

  //End Media



  const issue_status_stories = (status, coment_message) => {
    issue.issue_status_stories = issue.issue_status_stories ?? []
    issue.issue_status_stories?.unshift({
      status: {name: status.name, id: status.id},
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
      .then(() => {
        
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
    if(issue.escalation_administrativelevels.length != 0){
      current_escalate_to = issue.escalation_administrativelevels[0].escalate_to;
    }

    if(current_escalate_to && !current_escalate_to.administrative_id){
      ToastAndroid.show(`${t('error_message_for_update')}`, ToastAndroid.SHORT);
    }else{
      let administrative_level_to_escalate = get_next_administrative_level(current_escalate_to);

      issue.escalate_flag = true;
      issue.escalation_reasons = issue.escalation_reasons ?? [];
      issue.escalation_administrativelevels = issue.escalation_administrativelevels ?? [];

      let r = null;
      let escalate_reason = {
        id: eadl?.representative?.id,
        name: eadl?.representative?.name,
        comment: escalateComment,
        due_at: moment(),
      };
      if(escalatePDF){
        r = {
          name: escalatePDF?.uri.split('/').pop(),
          url: '',
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

    for(let i=0; i < attachments.length; i++){
      issue.reasons?.unshift({
        name: attachments[i]?.uri.split('/').pop(),
        url: '',
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
    for(let index=0; index < recordingURIs.length; index++){
      issue.reasons?.unshift({
        name: recordingURIs[index].split('/').pop(),
        url: '',
        local_url: recordingURIs[index],
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

    if(recordingURI){
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
    

    if(resolvePDF){
      let r = {
        name: resolvePDF?.uri.split('/').pop(),
        url: '',
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
      .then(() => {
        updateActionButtons();
        if (type === 'accept') {
          setAcceptedDialog(true);
        } else if (type === 'reject') {
          setRejectedDialog(true);
        } else if (type === 'record_resolution') {
          setRecordedResolution(false);
          _hideRecordResolutionDialog();
        }else if(type == 'not_resolve'){
          setNotResolveDialog(false);
          _hideNotresolveDialog();
        }
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
              disabled={!isAcceptEnabled}
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
                  color={isAcceptEnabled ? colors.primary : colors.disabled}
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
            // disabled={disableEscalation || !isRecordResolutionEnabled || issue.escalate_flag}
            disabled={!issue.status.id == 5 || currentAdlObj.escalate_to.administrative_level == "Country"}
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
                color={(issue.status.id == 5 && currentAdlObj.escalate_to.administrative_level != "Country") ? colors.primary : colors.disabled}
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
                  source={ escalatePDF.mimeType.includes('pdf') ? require('../../../../../assets/pdf.png') : { uri: attachment.uri }}
                  style={{
                    height: 80,
                    width: 80,
                    marginHorizontal: 1,
                    alignSelf: 'center',
                    justifyContent: 'flex-end',
                    marginVertical: 20,
                  }}
                >
                  {escalatePDF.mimeType.includes('pdf') ? <TouchableOpacity
                    onPress={() => showDoc(escalatePDF)}
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
                      backgroundColor: 'rgba(255, 1, 1, 1)',
                    }}
                  >
                    <Text style={{ color: 'white' }}>X</Text>
                  </TouchableOpacity>
                </ImageBackground>
              )}
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
              onPress={() => {pickDocument(false, false, true)}}
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
                disabled={escalateComment === ''}
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
              attachments.map((attachment, index) => (
                <ImageBackground
                  key={attachment.id}
                  source={ attachment.mimeType.includes('pdf') ? require('../../../../../assets/pdf.png') : { uri: attachment.uri }}
                  style={{
                    height: 80,
                    width: 80,
                    marginHorizontal: 1,
                    alignSelf: 'center',
                    justifyContent: 'flex-end',
                    marginVertical: 20,
                  }}
                >
                  {attachment.mimeType.includes('pdf') ? <TouchableOpacity
                    onPress={() => showDoc(attachment)}
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
                    onPress={() => removeAttachment(index)}
                    style={{
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: 20,
                      backgroundColor: 'rgba(255, 1, 1, 1)',
                    }}
                  >
                    <Text style={{ color: 'white' }}>X</Text>
                  </TouchableOpacity>
                </ImageBackground>
              ))}
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
              <IconButton icon="camera" color={colors.primary} size={24} onPress={openCamera} />
            </View>
            <View style={styles.iconButtonStyle}>
              <IconButton
                icon={recording ? 'record-circle-outline' : 'microphone'}
                color={recording ? '#f80102' : colors.primary}
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
              onPress={() => setRecordingURI()}
            />
          </View>
        )} */}
        {recordingURIs && recordingURIs.map((recording_url, index) => (
          <View
            key={recording_url}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconButton icon={soundUrl == recording_url ? "pause" : "play"} color={colors.primary} size={24} onPress={
              () => soundUrl == recording_url ? stopASound(recording_url) : playASound(recording_url)
            } />
            <View style={styles_audio.container}>
              <Animated.View style={[styles_audio.bar, { width: soundUrl == recording_url ? getProgress() : 0 }]} />
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
              {`(${index+1})`}
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
              >{parseInt(String(soundUrl == recording_url && position ? position/1000 : 0))}</Text>
            <IconButton
              icon="close"
              color={colors.error}
              size={24}
              onPress={() => reomveARecordingURI(recording_url)}
            />
          </View>
        ))}




              </>
            )}
          </Dialog.Content>
          {!recordedSteps ? (
            <Dialog.Actions>
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
                  source={ resolvePDF.mimeType.includes('pdf') ? require('../../../../../assets/pdf.png') : { uri: attachment.uri }}
                  style={{
                    height: 80,
                    width: 80,
                    marginHorizontal: 1,
                    alignSelf: 'center',
                    justifyContent: 'flex-end',
                    marginVertical: 20,
                  }}
                >
                  {resolvePDF.mimeType.includes('pdf') ? <TouchableOpacity
                    onPress={() => showDoc(resolvePDF)}
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
                      backgroundColor: 'rgba(255, 1, 1, 1)',
                    }}
                  >
                    <Text style={{ color: 'white' }}>X</Text>
                  </TouchableOpacity>
                </ImageBackground>
              )}
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
              onPress={() => {pickDocument(false, true)}}
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
                disabled={resolution === ''}
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
      <LoadingScreen visible={isLoading} />
    </ScrollView>
  );
}

export default Content;

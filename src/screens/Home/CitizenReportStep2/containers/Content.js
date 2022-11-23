import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  Platform,
  KeyboardAvoidingView,
  ImageBackground,
  TouchableOpacity,
  TextInput as NativeTextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Button, Checkbox, IconButton, TextInput } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import moment from 'moment';
import { Audio } from 'expo-av';
import i18n from 'i18n-js';
import CustomDropDownPicker from '../../../../components/CustomDropDownPicker/CustomDropDownPicker';
import { colors } from '../../../../utils/colors';
import { styles } from './Content.styles';

const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: 'white',
    placeholder: '#dedede',
    text: '#707070',
  },
};

function Content({ stepOneParams, issueCategories, issueTypes }) {
  const navigation = useNavigation();
  const [pickerValue, setPickerValue] = useState(null);
  const [pickerValue2, setPickerValue2] = useState(null);
  const [checked, setChecked] = useState(false);
  const [additionalDetails, setAdditionalDetails] = useState(null);
  const [date, setDate] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [recording, setRecording] = useState();
  const [items, setItems] = useState(issueTypes ?? []);
  const [recordingURI, setRecordingURI] = useState();
  const [items2, setItems2] = useState(issueCategories ?? []);
  const [sound, setSound] = React.useState();
  const [issueTypeCategoryError, setIssueTypeCategoryError] = React.useState(false);
  const [selectedIssueType, setSelectedIssueType] = useState(null);

  useEffect(() => {
    if (issueTypes) {
      setItems(issueTypes);
    }
    if (issueCategories) {
      setItems2(issueCategories);
    }
  }, [issueTypes, issueCategories]);

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
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, we need camera roll permissions to make this work!');
        }
      }
    })();
  }, []);

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (_date) => {
    setDate(_date);
    hideDatePicker();
  };

  const startRecording = async () => {
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
  };

  const stopRecording = async () => {
    // console.log("Stopping recording..");
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecordingURI(uri);
    setRecording(undefined);
    // console.log("Recording stopped and stored at", uri);
  };

  const playSound = async () => {
    // console.log("Loading Sound");
    const { sound } = await Audio.Sound.createAsync({ uri: recordingURI });
    setSound(sound);

    // console.log("Playing Sound");
    await sound.playAsync();
  };

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

  const openCamera = async () => {
    if (attachments.length < 3) {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.cancelled) {
        const manipResult = await ImageManipulator.manipulateAsync(
          result.localUri || result.uri,
          [{ resize: { width: 1000, height: 1000 } }],
          { compress: 1, format: ImageManipulator.SaveFormat.PNG }
        );
        setAttachments([...attachments, { ...manipResult, id: new Date() }]);
      }

    }
  };

  const pickImage = async () => {
    try {
      if(attachments.length < 3){
        const result = await ImagePicker.launchImageLibraryAsync({
          presentationStyle: 0,
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          allowsEditing: false,

          quality: 1,
        });
        if (!result.cancelled) {
          const manipResult = await ImageManipulator.manipulateAsync(
            result.localUri || result.uri,
            [{ resize: { width: 1000, height: 1000 } }],
            { compress: 1, format: ImageManipulator.SaveFormat.PNG },
          );
          setAttachments([...attachments, { ...manipResult, id: new Date() }]);
        }
      }
    } catch (e) {
      console.log(e)
    }
  };

  const getCategory = (value) => {
    const result = issueCategories.filter((obj) => obj.name === value);
    let _category;
    if(result[0]) {
      _category = {
        id: result[0].id,
        name: result[0].name,
        confidentiality_level: result[0].confidentiality_level,
        assigned_department: result[0].assigned_department?.id,
        administrative_level: result[0].assigned_department?.administrative_level,
      };

    }
    return _category;
  };

  const goToNextStep = () => {
      if (pickerValue2 !== null && selectedIssueType !== null) {
        setIssueTypeCategoryError(false)
        navigation.navigate('CitizenReportLocationStep', {
          stepOneParams,
          stepTwoParams: {
            date: date ? date.toISOString() : undefined,
            issueType: selectedIssueType
              ? { id: selectedIssueType.id, name: selectedIssueType.name }
              : null,
            ongoingEvent: checked,
            attachments: attachments.length > 0
              ? attachments.map((attachment) => ({
                  url: '',
                  id: attachment?.id,
                  uploaded: false,
                  local_url: attachment?.uri,
                  name: attachment?.uri.split('/').pop(),
                }))
              : undefined,
            recording: recordingURI
              ? {
                url: '',
                id: recordingURI.split('/').pop(),
                uploaded: false,
                local_url: recordingURI,
                isAudio: true,
                name: recordingURI.split('/').pop(),
              }
              : undefined,
            category: getCategory(pickerValue2),
            additionalDetails,
          },
        });
      } else {
        setIssueTypeCategoryError(true)
      }
    };


  function removeAttachment(index) {
    const array = [...attachments];
    array.splice(index, 1);
    setAttachments(array);
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null}>
        <View style={{ padding: 23 }}>
          <Text style={styles.stepText}>{i18n.t('step_3')}</Text>
          <Text style={styles.stepDescription}>{i18n.t('step_2_subtitle')}</Text>
          <Text style={styles.stepNote}>{i18n.t('step_2_explanation')}</Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: 23,
            paddingBottom: 10,
            justifyContent: 'space-between',
          }}
        >
          <Button
            theme={{ ...theme, colors: { ...theme.colors, primary: 'white' } }}
            icon="calendar"
            compact
            style={{
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 3,
              flex: 1,
              marginHorizontal: 10,
            }}
            uppercase={false}
            labelStyle={{
              color: colors.primary,
              fontFamily: 'Poppins_400Regular',
              fontSize: 13,
            }}
            mode="contained"
            onPress={showDatePicker}
          >
            {date ? moment(date).format('DD-MMMM-YY') : i18n.t('step_2_select_date')}
          </Button>
          <Button
            compact
            theme={theme}
            labelStyle={{
              color: 'white',
              fontFamily: 'Poppins_400Regular',
              fontSize: 12,
            }}
            mode="contained"
            uppercase={false}
            onPress={() => setDate(new Date())}
          >
            {i18n.t('step_2_set_today')}
          </Button>
        </View>
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: 43,
            paddingBottom: 10,
            alignItems: 'center',
          }}
        >
          <Checkbox.Android
            color={colors.primary}
            status={checked ? 'checked' : 'unchecked'}
            onPress={() => {
              setChecked(!checked);
            }}
          />
          <Text style={[styles.stepNote, { flex: 1 }]}>{i18n.t('step_2_ongoing_hint')}</Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: 23,
            marginBottom: 35,
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flex: 2 }} />
        </View>
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          maximumDate={new Date()}
          onConfirm={handleConfirm}
          onCancel={hideDatePicker}
        />
        <View style={{ zIndex: 2000 }}>
          <CustomDropDownPicker
            schema={{
              label: 'name',
              value: 'name',
            }}
            placeholder={i18n.t('step_2_placeholder_1')}
            value={pickerValue}
            items={items}
            setPickerValue={setPickerValue}
            setItems={setItems}
            onSelectItem={(item) => setSelectedIssueType(item)}
          />
        </View>
        <View style={{ zIndex: 1000 }}>
          <CustomDropDownPicker
            schema={{
              label: 'name',
              value: 'name',
              id: 'id',
              confidentiality_level: 'confidentiality_level',
              assigned_department: 'assigned_department',
            }}
            placeholder={i18n.t('step_2_placeholder_2')}
            value={pickerValue2}
            items={items2}
            setPickerValue={setPickerValue2}
            setItems={setItems2}
          />
        </View>
        {issueTypeCategoryError && <Text style={styles.errorText}>{i18n.t('please_select_option')}</Text>}

        <View style={{ paddingHorizontal: 50 }}>
          <TextInput
            multiline
            numberOfLines={4}
            style={[
              styles.grmInput,
              {
                height: 100,
                justifyContent: 'flex-start',
                textAlignVertical: 'top',
              },
            ]}
            placeholder={i18n.t('step_2_placeholder_3')}
            outlineColor="#f6f6f6"
            theme={theme}
            mode="outlined"
            value={additionalDetails}
            onChangeText={(text) => setAdditionalDetails(text)}
            render={(innerProps) => (
              <NativeTextInput
                {...innerProps}
                style={[
                  innerProps.style,
                  {
                    paddingTop: 8,
                    paddingBottom: 8,
                    height: 100,
                  },
                ]}
              />
            )}
          />
        </View>
        <View style={{ paddingHorizontal: 40 }}>
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
            {i18n.t('step_2_share_photos')}
          </Text>
          <View style={{flexDirection: 'row'}}>
            {attachments.length > 0 && attachments.map((attachment, index) => (
                  <ImageBackground
                    source={{ uri: attachment.uri }}
                    style={{
                      height: 80,
                      width: 80,
                      marginHorizontal: 1,
                      alignSelf: 'center',
                      justifyContent: 'flex-end',
                      marginVertical: 20,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => removeAttachment(index)}
                      style={{
                        alignItems: 'center',
                        padding: 5,
                        backgroundColor: 'rgba(36, 195, 139, 1)',
                      }}
                    >
                      <Text style={{ color: 'white' }}>X</Text>
                    </TouchableOpacity>
                  </ImageBackground>
                )
            )
            }
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
              {i18n.t('step_2_upload_attachment')}
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
        {recordingURI && (
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
              Play Recorded Audio
            </Text>
            <IconButton
              icon="close"
              color={colors.primary}
              size={24}
              onPress={() => setRecordingURI()}
            />
          </View>
        )}
        <View style={{ paddingHorizontal: 50 }}>
          <Button
            theme={theme}
            style={{ alignSelf: 'center', margin: 24 }}
            labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
            mode="contained"
            onPress={goToNextStep}
          >
            {i18n.t('next')}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

export default Content;

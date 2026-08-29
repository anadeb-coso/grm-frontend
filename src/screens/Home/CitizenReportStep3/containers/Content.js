import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import moment from 'moment';
import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image, Platform, ScrollView, Text, View, ImageBackground, TouchableOpacity,
  StyleSheet, Animated, Alert, Modal, Dimensions, KeyboardAvoidingView
} from 'react-native';
import { useToast } from 'react-native-toast-notifications';
import { Button, IconButton, ActivityIndicator, RadioButton, Checkbox, TextInput } from 'react-native-paper';
import { Snackbar } from 'react-native-paper';
import NetInfo from '@react-native-community/netinfo';
import { FontAwesome } from '@expo/vector-icons';
import Pdf from 'react-native-pdf';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Q } from '@nozbe/watermelondb';
import { colors } from '../../../../utils/colors';
import { database } from '../../../../database';
import { createWithId } from '../../../../database/utils/createWithId';
import { styles } from './Content.styles';
import { VERY_SENSITIVE } from '../../../../utils/utils';
import { check_issues } from '../../../../utils/functionsRequestsToApi';
import { enqueuePendingUploads, deleteAttachmentRemote } from '../../../../files/uploadQueue';
import CustomDropDownPicker from '../../../../components/CustomDropDownPicker/CustomDropDownPicker';

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

function Content({ issue, eadl, issueCategories, issueTypes, issueAges, citizenGroupsI, citizenGroupsII }) {
  const { t, i18n } = useTranslation();
  var toast = useToast();
  const navigation = useNavigation();
  const [isSyncing, setIsSyncing] = useState(false);

  // --- Champs modifiables du récapitulatif -----------------------------------------------------
  // Initialisés depuis `issue` (fusion de stepOneParams/stepTwoParams/stepLocationParams, cf.
  // CitizenReportStep3.js), pour que l'utilisateur puisse revoir ET corriger tout ce qui a été
  // saisi dans l'assistant, directement sur cet écran, sans perdre sa saisie en retournant dans
  // les écrans précédents (ceux-ci ne se réinitialisent pas depuis des paramètres entrants — voir
  // la seule exception gérée : `editLocation()` ci-dessous, pour le village/canton).
  const [typeOfPerson, setTypeOfPerson] = useState(issue.typeOfPerson ?? 'facilitator');
  const [methodOfContact, setMethodOfContact] = useState(issue.methodOfContact ?? 'email');
  const [contactInfo, setContactInfo] = useState(issue.contactInfo ?? '');
  const [citizenName, setCitizenName] = useState(issue.name ?? '');
  const [citizenType, setCitizenType] = useState(issue.citizen_type ?? null);
  const [citizenOrGroup, setCitizenOrGroup] = useState(issue.citizen_or_group ?? null);
  const [gender, setGender] = useState(issue.gender ?? null);
  const [ageGroup, setAgeGroup] = useState(issue.ageGroup ?? null);
  const [citizenGroup1, setCitizenGroup1] = useState(issue.citizen_group_1 ?? null);
  const [citizenGroup2, setCitizenGroup2] = useState(issue.citizen_group_2 ?? null);
  const [issueDate, setIssueDate] = useState(issue.date ? new Date(issue.date) : null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [category, setCategory] = useState(issue.category ?? null);
  const [issueType, setIssueType] = useState(issue.issueType ?? null);
  // `react-native-dropdown-picker` exige une valeur "brute" (l'id) séparée, contrôlée par
  // `setValue`, en plus de l'objet complet ci-dessus capturé via `onSelectItem` — même patron que
  // CitizenReportContactInfo/containers/Content.js (`pickerAgeValue` + `selectedAge`).
  const [ageGroupPickerValue, setAgeGroupPickerValue] = useState(issue.ageGroup?.id ?? null);
  const [citizenGroup1PickerValue, setCitizenGroup1PickerValue] = useState(issue.citizen_group_1?.id ?? null);
  const [citizenGroup2PickerValue, setCitizenGroup2PickerValue] = useState(issue.citizen_group_2?.id ?? null);
  const [categoryPickerValue, setCategoryPickerValue] = useState(issue.category?.id ?? null);
  const [issueTypePickerValue, setIssueTypePickerValue] = useState(issue.issueType?.id ?? null);
  const [ongoingEvent, setOngoingEvent] = useState(!!issue.ongoingEvent);
  const [eventRecurrence, setEventRecurrence] = useState(!!issue.eventRecurrence);
  const [description, setDescription] = useState(issue.additionalDetails ?? '');
  const [locationDescription, setLocationDescription] = useState(issue.locationDescription ?? '');
  const [structureName, setStructureName] = useState(issue.structure_in_charge?.name ?? '');
  const [structurePhone, setStructurePhone] = useState(issue.structure_in_charge?.phone ?? '');
  const [structureEmail, setStructureEmail] = useState(issue.structure_in_charge?.email ?? '');

  // Le village/canton (`issue.issueLocation`) n'est pas ré-éditable en place ici : reproduire son
  // sélecteur en cascade (canton -> village, résolu depuis le périmètre de l'ADL ou par appel
  // réseau, cf. CitizenReportLocationStep) dupliquerait une logique déjà complexe. On renvoie
  // plutôt l'utilisateur vers cet écran, qui a conservé son état (React Navigation ne démonte pas
  // les écrans plus bas dans la pile) ; "Suivant" y revient directement sur CitizenReportStep3
  // puisque c'est l'étape suivante immédiate. Les autres champs modifiés ci-dessus sont reconstruits
  // et transmis pour ne pas être perdus au passage — à l'exception de `locationDescription`/
  // `structure_in_charge`, propres à cet écran-là : s'ils sont modifiés ici ET que l'utilisateur
  // change aussi la localisation, cette édition ponctuelle sera écrasée par ce que LocationStep
  // renvoie de son côté (limite connue, acceptée : cas rare de double édition simultanée).
  const editLocation = () => {
    navigation.navigate('CitizenReportLocationStep', {
      stepOneParams: {
        typeOfPerson, methodOfContact, contactInfo,
        name: citizenName, citizen_type: citizenType, citizen_or_group: citizenOrGroup,
        gender, ageGroup, citizen_group_1: citizenGroup1, citizen_group_2: citizenGroup2,
        filledOnSomebodyElseBehalf: issue.filledOnSomebodyElseBehalf,
      },
      stepTwoParams: {
        date: issueDate ? issueDate.toISOString() : undefined,
        issueType, ongoingEvent, eventRecurrence, category,
        additionalDetails: description,
        attachments,
        recordings: [],
      },
    });
  };

  let _index = 0;

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
      ...(issue?.recordings ? issue.recordings : [])
    ]
  );
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  // Reflète, par fichier (clé = `attachment.id`), s'il a été effectivement envoyé au serveur —
  // piloté par le vrai `upload_status` WatermelonDB (pas une simple supposition optimiste),
  // relu après chaque tentative d'envoi. Un fichier absent de cette map (jamais encore tenté) est
  // traité comme "non envoyé", donc rouge, au même titre qu'un échec explicite.
  const [attachmentUploadStatuses, setAttachmentUploadStatuses] = useState({});
  const isAttachmentUploaded = (id) => attachmentUploadStatuses[id] === 'done';
  const attachmentStatusColor = (id) => (isAttachmentUploaded(id) ? colors.primary : colors.error);
  // Fait le pont entre les pièces jointes en mémoire (objets JS venant des étapes précédentes,
  // pas encore d'enregistrement WatermelonDB) et l'enregistrement `Attachment` créé pour elles dès
  // qu'on tente un envoi manuel (bouton "Envoyer les fichiers maintenant" ci-dessous) — un `ref`
  // plutôt qu'un state : cette correspondance n'a pas besoin de déclencher un re-rendu, seulement
  // d'être lue/écrite par `uploadAttachmentsManually`/`submitIssue`/`removeAttachment`.
  const attachmentRecordsRef = useRef({});

  function removeAttachment(id) {
    setSoundOnPause(false);
    let elt = attachments.find(elt => elt.id == id);
    if (elt && elt.isAudio) {
      stopASound();
    }

    // Si un envoi manuel avait déjà créé un enregistrement pour ce fichier (éventuellement déjà
    // envoyé au serveur), on le supprime : sinon il resterait orphelin (`issue_id` jamais rempli)
    // jusqu'au nettoyage automatique de `cleanup_orphan_attachments` (CLAUDE.md §8, 7 jours).
    const recordId = attachmentRecordsRef.current[id];
    if (recordId) {
      // `markAsDeleted()` (comme DocumentTask/RegisterSubprojects containers/Content.js) plutôt
      // qu'une destruction immédiate : reste cohérent avec le reste du code si jamais le fichier
      // avait déjà commencé à être poussé/lu ailleurs pendant l'envoi manuel.
      // `deleteAttachmentRemote` AVANT `markAsDeleted()` : `attachments` n'étant pas poussée par
      // le protocole de sync habituel, c'est le seul moyen de répercuter la suppression côté
      // serveur si le fichier avait déjà été envoyé (cf. files/uploadQueue.js).
      database.get('attachments').find(recordId)
        .then(async (record) => {
          await deleteAttachmentRemote(record);
          await database.write(() => record.markAsDeleted());
        })
        .catch(() => {});
      delete attachmentRecordsRef.current[id];
    }

    const array = attachments.filter(elt => elt.id !== id);
    setAttachments(array);
  }

  // Permet d'envoyer les fichiers vers le serveur avant même de soumettre la plainte (utile si
  // l'utilisateur reste un moment sur cet écran à relire/corriger le récapitulatif : les photos/
  // audio, souvent volumineux, partent déjà pendant ce temps au lieu d'attendre "Envoyer").
  // `attachmentRecordsRef` évite tout doublon : un fichier déjà créé (et a fortiori déjà envoyé,
  // `upload_status: 'done'`) n'est jamais recréé ni ré-uploadé, ici comme dans `submitIssue`
  // (`enqueuePendingUploads` exclut déjà `'done'` de son côté, cf. files/uploadQueue.js).
  const uploadAttachmentsManually = async () => {
    if (attachments.length === 0 || uploadingAttachments) return;
    setUploadingAttachments(true);
    try {
      for (const attachment of attachments) {
        if (attachmentRecordsRef.current[attachment.id]) continue;
        const record = await createWithId(database.get('attachments'), (a) => {
          a.fileName = attachment.name || (attachment.local_url || '').split('/').pop() || 'attachment';
          a.contentType = attachment.isAudio ? 'audio/m4a' : (attachment.mimeType || 'image/jpeg');
          a.localUri = attachment.local_url;
          a.uploadStatus = 'pending';
          a.downloadStatus = 'done';
        });
        attachmentRecordsRef.current[attachment.id] = record.id;
      }

      // Feedback dédié ci-dessous (toast succès/échec) : pas besoin du toast générique.
      await enqueuePendingUploads({ notifyOnError: false });

      const idRecordPairs = Object.entries(attachmentRecordsRef.current);
      const records = await Promise.all(
        idRecordPairs.map(([, recordId]) => database.get('attachments').find(recordId)),
      );
      // Reflète le statut réel de chaque fichier (vert = envoyé, rouge sinon) sur les vignettes.
      setAttachmentUploadStatuses((prev) => ({
        ...prev,
        ...Object.fromEntries(idRecordPairs.map(([localId], i) => [localId, records[i].uploadStatus])),
      }));
      const anyError = records.some((r) => r.uploadStatus === 'error');
      if (anyError) {
        toast?.show(t('attachments_upload_deferred'), { type: 'danger', duration: 5000 });
      } else {
        toast?.show(t('attachments_synchronized'), { type: 'success', duration: 2500 });
      }
    } catch (err) {
      console.log(err);
      toast?.show(t('attachments_upload_deferred'), { type: 'danger', duration: 5000 });
    } finally {
      setUploadingAttachments(false);
    }
  };

  // Résout la clé primaire WatermelonDB (UUID) d'un enregistrement de référence à partir de son
  // `legacy_id` numérique (l'id CouchDB historique, conservé côté serveur — cf. issue/models.py).
  const resolveReferenceId = async (tableName, legacyId) => {
    if (legacyId === undefined || legacyId === null) return null;
    const records = await database.get(tableName).query(Q.where('legacy_id', Number(legacyId))).fetch();
    return records[0]?.id ?? null;
  };

  const showIssueDatePicker = () => setDatePickerVisibility(true);
  const hideIssueDatePicker = () => setDatePickerVisibility(false);
  const handleIssueDateConfirm = (pickedDate) => {
    setIssueDate(pickedDate);
    hideIssueDatePicker();
  };

  const submitIssue = async () => {
    setSubmitting(true);
    try {
      const isAssignee = category?.confidentiality_level != VERY_SENSITIVE;
      const randomCodeNumber = Math.floor(Math.random() * 1000);
      const trackingCode = `${randomWord(SAMPLE_WORDS)}${randomCodeNumber}`;

      const [statusId, categoryId, issueTypeId, ageGroupId] = await Promise.all([
        resolveReferenceId('issue_statuses', 1), // "Enregistrée" (statut initial)
        resolveReferenceId('issue_categories', category?.id),
        resolveReferenceId('issue_types', issueType?.id),
        resolveReferenceId('issue_age_groups', ageGroup?.id),
      ]);
      // `administrative_region` est requis côté serveur (sync/serializers.py::IssueSyncSerializer,
      // `required=True`) : un défaut silencieux à 0 (id inexistant) ferait échouer le push bien
      // plus tard, au moment de la synchronisation, au lieu d'être bloqué ici avec un message
      // clair — même garde-fou que pour statusId/categoryId/issueTypeId ci-dessus.
      const administrativeRegionId = parseInt(issue.issueLocation?.administrative_id, 10);

      if (!statusId || !categoryId || !issueTypeId) {
        Alert.alert('Erreur', t('repository_not_found_locally')); 
        setSubmitting(false);
        return;
      }

      if (!administrativeRegionId || Number.isNaN(administrativeRegionId)) {
        Alert.alert('Erreur', t('location_not_specified'));
      }

      const internalCode = `${category?.abbreviation || 'ISS'}-${Date.now()}-${randomCodeNumber}`;

      const newIssue = await createWithId(database.get('issues'), (r) => {
        r.internalCode = internalCode;
        r.trackingCode = trackingCode;
        r.autoIncrementId = parseInt(String(Date.now()).slice(-8));
        r.description = description;
        r.confirmed = true;
        r.statusId = statusId;
        r.categoryId = categoryId;
        r.issueTypeId = issueTypeId;
        r.ageGroupId = ageGroupId;
        r.assigneeId = isAssignee ? eadl.representative?.id : null;
        r.assigneeName = isAssignee ? eadl.representative?.name : null;
        r.reporterId = eadl.representative?.id;
        r.reporterName = eadl.representative?.name;
        r.citizen = citizenName ?? '';
        r.contactMedium = typeOfPerson;
        r.citizenType = citizenType;
        r.citizenGroup1 = citizenGroup1;
        r.citizenGroup2 = citizenGroup2;
        r.citizenOrGroup = citizenOrGroup;
        r.locationInfo = {
          issue_location: issue.issueLocation,
          location_description: locationDescription,
        };
        r.administrativeRegionId = administrativeRegionId;
        r.administrativeRegionName = issue.issueLocation?.name;
        r.structureInCharge = { name: structureName, phone: structurePhone, email: structureEmail };
        r.createdDate = new Date();
        r.intakeDate = new Date();
        r.issueDate = issueDate ?? new Date();
        r.resolutionDays = 0;
        r.ongoingIssue = !!ongoingEvent;
        r.eventRecurrence = !!eventRecurrence;
        r.contactInformation = {
          type: methodOfContact,
          contact: contactInfo,
        };
        r.commune = {
          code: eadl.commune,
          name: eadl.name,
          prefecture: '',
        };
        r.source = 'mobile';
        r.publish = false;
        r.notificationSend = false;
      });

      // Les pièces jointes deviennent des enregistrements `Attachment` séparés — sauf celles déjà
      // créées (et potentiellement déjà envoyées) via le bouton d'upload manuel ci-dessus : on se
      // contente alors de les rattacher à la plainte, sans en recréer un doublon ni relancer leur
      // envoi (`enqueuePendingUploads` exclut de toute façon déjà `upload_status: 'done'`).
      for (const attachment of attachments) {
        const existingRecordId = attachmentRecordsRef.current[attachment.id];
        if (existingRecordId) {
          const record = await database.get('attachments').find(existingRecordId);
          await database.write(async () => {
            await record.update((a) => { a.issueId = newIssue.id; });
          });
        } else {
          await createWithId(database.get('attachments'), (a) => {
            a.issueId = newIssue.id;
            a.fileName = attachment.name || (attachment.local_url || '').split('/').pop() || 'attachment';
            a.contentType = attachment.isAudio ? 'audio/m4a' : (attachment.mimeType || 'image/jpeg');
            a.localUri = attachment.local_url;
            a.uploadStatus = 'pending';
            a.downloadStatus = 'done';
          });
        }
      }

      // Tentative d'envoi immédiate vers le serveur : la plainte est déjà enregistrée localement
      // (offline-first, ce qui précède ne dépend jamais du réseau) — cet appel est donc non
      // bloquant, et un échec (hors-ligne, etc.) laisse simplement les pièces jointes `pending`,
      // reprises plus tard par la synchronisation périodique ou par l'écran SyncAttachments.
      if (attachments.length > 0) {
        // Feedback dédié ci-dessous (toast succès/échec) : pas besoin du toast générique.
        enqueuePendingUploads({ notifyOnError: false })
          .then(async () => {
            const stillPending = await database.get('attachments')
              .query(Q.where('issue', newIssue.id), Q.where('upload_status', Q.notEq('done')))
              .fetch();
            if (stillPending.length > 0) {
              toast?.show(t('attachments_upload_deferred'), { type: 'danger', duration: 5000 });
            } else {
              toast?.show(t('attachments_synchronized'), { type: 'success', duration: 2500 });
            }
          })
          .catch(() => {
            toast?.show(t('attachments_upload_deferred'), { type: 'danger', duration: 5000 });
          });
      }

      //Check Issues to sync (new issues, escalade issues, assignment)
      check_issues(null, eadl, i18n.language);

      navigation.navigate('CitizenReportStep4', {
        issue: {
          ...issue,
          id: newIssue.id,
          tracking_code: trackingCode,
          internal_code: internalCode,
          name: citizenName,
          category,
          issueType,
          ageGroup,
          date: issueDate,
          additionalDetails: description,
        },
      });
    } catch (err) {
      console.log(err);
      Alert.alert('Erreur', t('not_possible_to_register'));
    } finally {
      setSubmitting(false);
    }
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
  };

  const onPlaybackStatusUpdate = (status) => {
    setDuration(status.durationMillis);
    setPosition(status.positionMillis);

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

  const cardStyle = {
    margin: 23,
    marginBottom: 12,
    padding: 18,
    borderRadius: 10,
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 15,
    shadowOpacity: 1,
    elevation: 7,
    backgroundColor: 'white',
  };
  const radioRowStyle = { flexDirection: 'row', alignItems: 'center', marginVertical: 3 };

  return (
    <ScrollView>
      <View style={{ padding: 23 }}>
        <Text style={styles.stepText}>{t('step_5')}</Text>
        <Text style={styles.stepSubtitle}>{t('step_3_confirmation')}</Text>
        <Text style={styles.stepDescription}>{t('step_3_subtitle')}</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'position' : null}>
        {/* --- Déclarant ---------------------------------------------------------------------- */}
        <View style={cardStyle}>
          <Text style={styles.stepSubtitle}>{t('step_3_section_reporter')}</Text>
          <RadioButton.Group onValueChange={setTypeOfPerson} value={typeOfPerson}>
            <View style={radioRowStyle}>
              <RadioButton.Android value="anonymous" uncheckedColor="#dedede" color={colors.primary} />
              <Text style={styles.radioLabel}>{t('step_1_option_1')}</Text>
            </View>
            <View style={radioRowStyle}>
              <RadioButton.Android value="facilitator" uncheckedColor="#dedede" color={colors.primary} />
              <Text style={styles.radioLabel}>{t('step_1_option_2')}</Text>
            </View>
            <View style={radioRowStyle}>
              <RadioButton.Android value="channel-alert" uncheckedColor="#dedede" color={colors.primary} />
              <Text style={styles.radioLabel}>{t('step_1_option_3')}</Text>
            </View>
          </RadioButton.Group>
          {typeOfPerson === 'channel-alert' && (
            <View style={{marginLeft: 25}}>
              <RadioButton.Group onValueChange={setMethodOfContact} value={methodOfContact}>
                <View style={radioRowStyle}>
                  <RadioButton.Android value="email" uncheckedColor="#dedede" color={colors.primary} />
                  <Text style={styles.radioLabel}>{t('step_1_method_3')}</Text>
                </View>
                <View style={radioRowStyle}>
                  <RadioButton.Android value="phone_number" uncheckedColor="#dedede" color={colors.primary} />
                  <Text style={styles.radioLabel}>{t('step_1_method_4')}</Text>
                </View>
                <View style={radioRowStyle}>
                  <RadioButton.Android value="sms" uncheckedColor="#dedede" color={colors.primary} />
                  <Text style={styles.radioLabel}>{t('step_1_method_1')}</Text>
                </View>
                <View style={radioRowStyle}>
                  <RadioButton.Android value="whatsapp" uncheckedColor="#dedede" color={colors.primary} />
                  <Text style={styles.radioLabel}>{t('step_1_method_2')}</Text>
                </View>
                <View style={radioRowStyle}>
                  <RadioButton.Android value="letter" uncheckedColor="#dedede" color={colors.primary} />
                  <Text style={styles.radioLabel}>{t('step_1_method_5')}</Text>
                </View>
              </RadioButton.Group>
              <TextInput
                style={styles.grmInput}
                placeholder={t('step_1_placeholder_2')}
                outlineColor="#3e4000"
                placeholderTextColor="#5f6800"
                theme={theme}
                mode="outlined"
                value={contactInfo}
                onChangeText={setContactInfo}
              />
            </View>
          )}
        </View>

        {/* --- Plaignant ----------------------------------------------------------------------- */}
        <View style={cardStyle}>
          <Text style={styles.stepSubtitle}>{t('step_3_section_citizen')}</Text>
          <TextInput
            style={styles.grmInput}
            placeholder={t('contact_step_placeholder_1')}
            outlineColor="#3e4000"
            placeholderTextColor="#5f6800"
            theme={theme}
            mode="outlined"
            value={citizenName}
            onChangeText={setCitizenName}
          />
          <Text />
          <RadioButton.Group onValueChange={setCitizenType} value={citizenType}>
            <View style={radioRowStyle}>
              <RadioButton.Android value={1} uncheckedColor="#dedede" color={colors.primary} />
              <Text style={styles.radioLabel}>{t('step_2_keep_name_confidential')}</Text>
            </View>
            <View style={radioRowStyle}>
              <RadioButton.Android value={2} uncheckedColor="#dedede" color={colors.primary} />
              <Text style={styles.radioLabel}>{t('step_2_on_behalf_of_someone')}</Text>
            </View>
            <View style={radioRowStyle}>
              <RadioButton.Android value={3} uncheckedColor="#dedede" color={colors.primary} />
              <Text style={styles.radioLabel}>{t('step_2_organization_behalf_someone')}</Text>
            </View>
          </RadioButton.Group>
          <Text style={styles.radioLabel}>{t('step_2_citizen_or_group_label')}</Text>
          <RadioButton.Group onValueChange={setCitizenOrGroup} value={citizenOrGroup}>
            <View style={radioRowStyle}>
              <RadioButton.Android value="Individual" uncheckedColor="#dedede" color={colors.primary} />
              <Text style={styles.radioLabel}>{t('step_2_citizen_or_group_individual')}</Text>
            </View>
            <View style={radioRowStyle}>
              <RadioButton.Android value="Group" uncheckedColor="#dedede" color={colors.primary} />
              <Text style={styles.radioLabel}>{t('step_2_citizen_or_group_group')}</Text>
            </View>
          </RadioButton.Group>
          <Text style={styles.radioLabel}>{t('contact_step_placeholder_3')}</Text>
          <RadioButton.Group onValueChange={setGender} value={gender}>
            <View style={radioRowStyle}>
              <RadioButton.Android value="male" uncheckedColor="#dedede" color={colors.primary} />
              <Text style={styles.radioLabel}>{t('male')}</Text>
            </View>
            <View style={radioRowStyle}>
              <RadioButton.Android value="female" uncheckedColor="#dedede" color={colors.primary} />
              <Text style={styles.radioLabel}>{t('female')}</Text>
            </View>
          </RadioButton.Group>
          {issueAges && issueAges.length > 0 && (
            <View style={{ zIndex: 5000 }}>
              <CustomDropDownPicker
                schema={{ label: 'name', value: 'id' }}
                placeholder={t('contact_step_placeholder_2')}
                value={ageGroupPickerValue}
                items={issueAges}
                setPickerValue={setAgeGroupPickerValue}
                setItems={() => {}}
                onSelectItem={(item) => setAgeGroup(item)}
                zIndex={5000}
                zIndexInverse={1000}
              />
            </View>
          )}
          {citizenGroupsI && citizenGroupsI.length > 0 && (
            <View style={{ zIndex: 4000 }}>
              <CustomDropDownPicker
                schema={{ label: 'name', value: 'id' }}
                placeholder="Citizen Group I"
                value={citizenGroup1PickerValue}
                items={citizenGroupsI}
                setPickerValue={setCitizenGroup1PickerValue}
                setItems={() => {}}
                onSelectItem={(item) => setCitizenGroup1(item)}
                zIndex={4000}
                zIndexInverse={2000}
              />
            </View>
          )}
          {citizenGroupsII && citizenGroupsII.length > 0 && (
            <View style={{ zIndex: 3000 }}>
              <CustomDropDownPicker
                schema={{ label: 'name', value: 'id' }}
                placeholder="Citizen Group II"
                value={citizenGroup2PickerValue}
                items={citizenGroupsII}
                setPickerValue={setCitizenGroup2PickerValue}
                setItems={() => {}}
                onSelectItem={(item) => setCitizenGroup2(item)}
                zIndex={3000}
                zIndexInverse={3000}
              />
            </View>
          )}
        </View>

        {/* --- Détails de la plainte ------------------------------------------------------------ */}
        <View style={cardStyle}>
          <Text style={styles.stepSubtitle}>{t('step_3_field_title_1')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Button
              compact
              theme={theme}
              mode="outlined"
              uppercase={false}
              style={{ borderColor: colors.primary }}
              labelStyle={{ color: colors.primary, fontFamily: 'Poppins_400Regular', fontSize: 13 }}
              onPress={showIssueDatePicker}
            >
              {issueDate ? moment(issueDate).format('DD-MMMM-YY') : t('step_2_select_date')}
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
              onPress={() => setIssueDate(new Date())}
            >
              {t('step_2_set_today')}
            </Button>
          </View>
          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            maximumDate={new Date()}
            date={issueDate ?? new Date()}
            onConfirm={handleIssueDateConfirm}
            onCancel={hideIssueDatePicker}
          />

          <Text style={styles.stepSubtitle}>{t('step_3_field_title_2')}</Text>
          {issueCategories && issueCategories.length > 0 ? (
            <View style={{ zIndex: 2000 }}>
              <CustomDropDownPicker
                schema={{ label: 'name', value: 'id' }}
                placeholder={t('step_2_placeholder_1')}
                value={categoryPickerValue}
                items={issueCategories}
                setPickerValue={setCategoryPickerValue}
                setItems={() => {}}
                onSelectItem={(item) => setCategory(item)}
                zIndex={2000}
                zIndexInverse={4000}
              />
            </View>
          ) : (
            <Text style={styles.stepDescription}>{category?.name ?? '--'}</Text>
          )}

          {/* {issueTypes && issueTypes.length > 0 && (
            <View style={{ zIndex: 1000 }}>
              <CustomDropDownPicker
                schema={{ label: 'name', value: 'id' }}
                placeholder={t('step_3_field_title_3')}
                value={issueTypePickerValue}
                items={issueTypes}
                setPickerValue={setIssueTypePickerValue}
                setItems={() => {}}
                onSelectItem={(item) => setIssueType(item)}
                zIndex={1000}
                zIndexInverse={5000}
              />
            </View>
          )} */}

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Checkbox.Android
              color={colors.primary}
              status={ongoingEvent ? 'checked' : 'unchecked'}
              onPress={() => setOngoingEvent(!ongoingEvent)}
            />
            <Text style={[styles.stepNote, { flex: 1 }]}>{t('step_2_ongoing_hint')}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Checkbox.Android
              color={colors.primary}
              status={eventRecurrence ? 'checked' : 'unchecked'}
              onPress={() => setEventRecurrence(!eventRecurrence)}
            />
            <Text style={[styles.stepNote, { flex: 1 }]}>{t('step_2_recurrence')}</Text>
          </View>

          <Text style={styles.stepSubtitle}>{t('step_3_field_title_4')}</Text>
          <TextInput
            multiline
            numberOfLines={4}
            style={[styles.grmInput, { height: 100, justifyContent: 'flex-start', textAlignVertical: 'top' }]}
            outlineColor="#3e4000"
            placeholderTextColor="#5f6800"
            theme={theme}
            mode="outlined"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* --- Localisation ----------------------------------------------------------------------- */}
        <View style={cardStyle}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={styles.stepSubtitle}>{t('step_3_field_location')}</Text>
            <Button compact mode="text" uppercase={false} onPress={editLocation} labelStyle={{ color: colors.primary }}>
              {t('edit')}
            </Button>
          </View>
          <Text style={styles.stepDescription}>{issue.issueLocation?.name ?? '--'}</Text>

          <Text style={styles.stepSubtitle}>{t('step_3_field_location_description')}</Text>
          <TextInput
            multiline
            numberOfLines={3}
            style={[styles.grmInput, { height: 80, justifyContent: 'flex-start', textAlignVertical: 'top' }]}
            placeholder={t('step_location_input_explanation')}
            outlineColor="#3e4000"
            placeholderTextColor="#5f6800"
            theme={theme}
            mode="outlined"
            value={locationDescription}
            onChangeText={setLocationDescription}
          />

          <Text style={styles.stepSubtitle}>{t('step_3_field_structure')}</Text>
          <TextInput
            style={styles.grmInput}
            disabled={true}
            placeholder={t('step_2_structure_in_charge_name')}
            outlineColor="#3e4000"
            placeholderTextColor="#5f6800"
            theme={theme}
            mode="outlined"
            value={structureName}
            onChangeText={setStructureName}
          />
          <Text />
          {/* <TextInput
            style={styles.grmInput}
            placeholder={t('step_2_structure_in_charge_phone')}
            outlineColor="#3e4000"
            placeholderTextColor="#5f6800"
            theme={theme}
            mode="outlined"
            value={structurePhone}
            onChangeText={setStructurePhone}
          />
          <Text />
          <TextInput
            style={styles.grmInput}
            placeholder={t('step_2_structure_in_charge_email')}
            outlineColor="#3e4000"
            placeholderTextColor="#5f6800"
            theme={theme}
            mode="outlined"
            value={structureEmail}
            onChangeText={setStructureEmail}
          /> */}
        </View>
      </KeyboardAvoidingView>

      <View style={cardStyle}>
        <Text style={styles.stepSubtitle}>{t('step_3_attachments')}</Text>
        {attachments &&
          attachments.length > 0 &&
          attachments.map((attachment, index) => {
            if (attachment.isAudio) {
              let audio_url = attachment.local_url || attachment.url || attachment.uri;
              let audio_url_split = audio_url.split("?")[0].split("/");
              let audio_file_name = audio_url_split[audio_url_split.length - 1];

              let audio_url_current = soundUrl || "";
              let audio_url_split_current = audio_url_current.split("?")[0].split("/");
              let audio_file_name_current = audio_url_split_current[audio_url_split_current.length - 1];

              _index++;
              return (
                <View
                  key={`${attachment.id} ${audio_url}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderLeftWidth: 4,
                    borderLeftColor: attachmentStatusColor(attachment.id),
                  }}
                >
                  <IconButton icon={!soundOnPause && audio_file_name_current == audio_file_name ? "pause" : "play"} iconColor={colors.primary} size={24} onPress={
                    () => audio_file_name_current == audio_file_name ? (soundOnPause ? playASoundOnCurrentPause() : pauseASound()) : playASound(audio_url)
                  } />
                  <View style={{ flex: 1, flexDirection: 'column' }}>
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
          <>
            <>
              {
                attachments.map((attachment, index) => {
                  if (!attachment.isAudio) {
                    let urlL = attachment.local_url || attachment.url || attachment.uri;
                    return (
                      <View style={{ flex: 1, flexDirection: 'row' }}>
                        <ImageBackground
                          key={`${attachment.id} ${urlL}`}
                          source={(urlL && urlL.includes('.pdf')) ? require('../../../../../assets/pdf.png') : { uri: urlL }}
                          style={{
                            height: 80,
                            width: 80,
                            marginHorizontal: 1,
                            alignSelf: 'flex-start',
                            justifyContent: 'flex-end',
                            marginVertical: 20,
                            borderWidth: 3,
                            borderColor: attachmentStatusColor(attachment.id),
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
                      </View>

                    )
                  }
                })
              }
            </>
          </>
        }

        {attachments && attachments.length > 0 && (
          <Button
            compact
            theme={theme}
            mode="outlined"
            uppercase={false}
            disabled={uploadingAttachments}
            loading={uploadingAttachments}
            style={{ alignSelf: 'flex-start', marginTop: 10, borderColor: colors.primary }}
            labelStyle={{ color: colors.primary, fontFamily: 'Poppins_400Regular', fontSize: 13 }}
            onPress={uploadAttachmentsManually}
          >
            {t('upload_files_now')}
          </Button>
        )}
      </View>
      <View style={{ paddingHorizontal: 50 }}>
        <Button
          theme={theme}
          disabled={!eadl || submitting}
          style={{ alignSelf: 'center', margin: 24, backgroundColor: submitting ? colors.disabled : colors.primary }}
          labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
          mode="contained"
          loading={submitting}
          onPress={() => submitIssue()}
        >
          {t('submit_button_text')}
        </Button>
      </View>

      <Snackbar visible={errorVisible} duration={1000} onDismiss={onDismissSnackBar}>
        {errorMessage}
      </Snackbar>


    </ScrollView>
  );
}

export default Content;

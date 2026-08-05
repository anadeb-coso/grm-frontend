import { AntDesign, Feather } from '@expo/vector-icons';
import moment from 'moment';
import React, { useEffect, useState, useRef } from 'react';
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
  ProgressBarAndroid,
  RefreshControl
} from 'react-native';
import { Button, Dialog, Paragraph, Portal, TextInput, IconButton } from 'react-native-paper';
import { Audio } from 'expo-av';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Snackbar } from 'react-native-paper';
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system';
import { Q } from '@nozbe/watermelondb';
import { colors } from '../../../../utils/colors';
import { database } from '../../../../database';
import { createWithId } from '../../../../database/utils/createWithId';
import { runSyncSafely } from '../../../../database/watermelonSyncManager';
import { toLegacyIssueShape } from '../../../../utils/issueLegacyShape';
import { styles } from './Content.styles';
import LoadingScreen from '../../../../components/LoadingScreen/LoadingScreen';
import { formatDuration, getImageSize, image_compress, getImageDimensions, getAudioDuration } from '../../../../utils/functions';
import { check_issues } from '../../../../utils/functionsRequestsToApi';
import { enqueuePendingUploads, deleteAttachmentRemote } from '../../../../files/uploadQueue';



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
  const issueRecord = issue.record;

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
  const [isSyncing, setIsSyncing] = useState(false);
  const [escalateFlag, setEscalateFlag] = useState(!!issue?.escalate_flag);

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



  // Résout la clé primaire WatermelonDB (UUID) d'un enregistrement de référence à partir de son
  // `legacy_id` numérique — `statuses` (prop) ne porte que des objets bruts {id, name, ...}
  // mappés depuis `issue_statuses` (IssueActions.js), sans référence `.record` vers
  // l'enregistrement WatermelonDB local (contrairement à `issue.status`/`issue.category`, issus
  // de `toLegacyIssueShape`). Utiliser `newStatus.record.id` ici (comme le faisait le code avant
  // ce fix) lève `TypeError: Cannot read property 'id' of undefined` à chaque changement de
  // statut/ajout d'historique.
  const resolveReferenceId = async (tableName, legacyId) => {
    if (legacyId === undefined || legacyId === null) return null;
    const records = await database.get(tableName).query(Q.where('legacy_id', Number(legacyId))).fetch();
    return records[0]?.id ?? null;
  };

  // Remonte d'un cran la hiérarchie administrative locale (`administrative_regions`, table de
  // cache alimentée par syncAdministrativeLevels(), CLAUDE.md §4.7) à partir d'un `server_id`.
  const get_parent_administrative_region = async (administrativeId) => {
    if (!administrativeId) return null;
    
    const current = (await database.get('administrative_regions')
      .query(Q.where('server_id', Number(administrativeId))).fetch())[0];
    
    if (!current || !current.parentId) return null;
    return (await database.get('administrative_regions')
      .query(Q.where('server_id', Number(current.parentId))).fetch())[0] || null;
  };

  // Logique de remontée hiérarchique (procédure de gestion des plaintes §5) :
  //  - Village (ou tout niveau de base) → Canton (parent immédiat)
  //  - Canton → Région si la région est "Savanes" (saute la préfecture), sinon → Préfecture
  //    (régions Kara/Centrale)
  //  - Préfecture ou Région → toujours National, quel que soit le niveau atteint juste avant
  // Résolu via la vraie hiérarchie administrative (table locale), plus une liste blanche de
  // cantons forcément incomplète.
  const get_next_administrative_level = async (current_escalate_to) => {
    const level = current_escalate_to?.administrative_level;

    if (level === "Prefecture" || level === "Region") {
      return { administrative_level: "Country", administrative_id: null, name: "TOGO" };
    }

    if (level === "Canton") {
      const commune = await get_parent_administrative_region(current_escalate_to.administrative_id);
      
      if (!commune) {
        ToastAndroid.show(`${t('error_message_for_update')}`, ToastAndroid.SHORT);
        return null;
      }

      const prefecture = await get_parent_administrative_region(commune.serverId ?? commune.server_id);
      
      if (!prefecture) {
        ToastAndroid.show(`${t('error_message_for_update')}`, ToastAndroid.SHORT);
        return null;
      }
      const region = await get_parent_administrative_region(prefecture.serverId ?? prefecture.server_id);
      
      if (region && region.name?.toUpperCase() === 'SAVANES') {
        return { administrative_level: region.type ?? "Region", administrative_id: region.serverId ?? region.server_id, name: region.name };
      }
      return { administrative_level: prefecture.type ?? "Prefecture", administrative_id: prefecture.serverId ?? prefecture.server_id, name: prefecture.name };
    }

    // Niveau initial (village, ou catégorie traitée dès un niveau de base) → canton parent.
    const canton = await get_parent_administrative_region(current_escalate_to?.administrative_id);
    
    if (!canton) {
      ToastAndroid.show(`${t('error_message_for_update')}`, ToastAndroid.SHORT);
      return null;
    }
    return { administrative_level: canton.type ?? "Canton", administrative_id: canton.serverId ?? canton.server_id, name: canton.name };
  }

  // Le niveau d'escalade courant se détermine par rang hiérarchique fixe (Canton -> Préfecture/
  // Région -> Pays, cf. get_next_administrative_level ci-dessus), PAS par `created_at` : sur les
  // issues migrées depuis CouchDB, `escalation_administrativelevels[]` était stocké du plus
  // récent au plus ancien (comme tous les autres tableaux legacy), et migrate_grm_issues.py a
  // recréé les lignes `EscalationLevel` dans cet ordre littéral plutôt que chronologique réel —
  // le tout premier niveau atteint (ex. Canton) se retrouve donc avec le `created_at` le plus
  // récent, et inversement. Trier par rang évite de dépendre de timestamps historiques erronés,
  // et reste valide pour les escalades créées après la migration (progression toujours croissante).
  const ESCALATION_LEVEL_RANK = { Village: 1, Canton: 2, Commune: 3, Prefecture: 4, Region: 5, Country: 6 };

  const get_current_adl_obj = async () => {
    const levels = await database.get('escalation_levels')
      .query(Q.where('issue', issueRecord.id))
      .fetch();
      
    if (levels.length !== 0) {
      const lvl = levels.reduce((highest, current) => {
        
        const highestRank = ESCALATION_LEVEL_RANK[highest.administrativeLevel] ?? 0;
        const currentRank = ESCALATION_LEVEL_RANK[current.administrativeLevel] ?? 0;
        if (currentRank !== highestRank) return currentRank > highestRank ? current : highest;
        return (current.createdAt?.getTime() || 0) > (highest.createdAt?.getTime() || 0) ? current : highest;
      });
      
      setCurrentAdlObj({
        escalate_to: {
          administrative_id: lvl.administrativeId,
          name: lvl.name,
          administrative_level: lvl.administrativeLevel,
        },
        due_at: lvl.dueAt,
      });
    } else {
      // Pas (encore) d'historique d'escalade : retombe sur le niveau administratif/catégorie
      // COURANTS de `issue` plutôt que de laisser la valeur figée au montage de l'écran — utile
      // après un rafraîchissement où `issue.administrative_region`/`issue.category` ont pu changer
      // côté serveur (réaffectation, correction de localisation...).
      setCurrentAdlObj({
        escalate_to: {
          administrative_id: issue.administrative_region.administrative_id,
          name: issue.administrative_region.name,
          administrative_level: issue.category.administrative_level,
        },
        due_at: issue.issue_date,
      });
    }
  }

  useEffect(() => {
    get_current_adl_obj();
  }, []);

  const [refreshing, setRefreshing] = useState(false);
  // Contrairement à IssueDetail, `statuses` est chargé une seule fois par le parent
  // (IssueActions.js, useEffect au montage) et n'est pas re-fetchable ici sans dupliquer cette
  // requête (référentiel qui change rarement, cf. CLAUDE.md).
  //
  // `issue` (le dict "legacy shape", cf. utils/issueLegacyShape.js) est construit UNE SEULE FOIS
  // par l'écran appelant (IssueActions.js, au moment de la navigation) puis muté en place ici —
  // `runSyncSafely()` met bien à jour la ligne SQLite sous-jacente (`issueRecord`), mais rien ne
  // rafraîchissait ensuite les champs scalaires/relations de `issue` (statut, catégorie,
  // assignation, description, résultat de recherche...) à partir de `issueRecord` : un
  // rafraîchissement manuel resynchronisait bien le serveur, sans jamais faire réapparaître le
  // changement à l'écran — ni sur les informations affichées, ni sur les boutons d'action (dérivés
  // de `issue.status`/`issue.category`, cf. `updateActionButtons`). D'où le correctif : reconstruire
  // `issue` depuis `issueRecord` (déjà à jour après le sync) et rejouer tout ce qui en dérive.
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await runSyncSafely();
      Object.assign(issue, await toLegacyIssueShape(issueRecord));
      refreshAssigneeDerivedState();
      updateActionButtons();
      await get_current_adl_obj();
    } catch (err) {
      console.warn(err);
    } finally {
      setRefreshing(false);
    }
  };

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
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  // Fait le pont entre les fichiers locaux en mémoire (`attachments`/`recordingURIs`/`resolvePDF`/
  // `escalatePDF`, tous identifiables par leur `.uri` unique) et l'enregistrement `Attachment`
  // WatermelonDB créé pour eux dès qu'un envoi manuel est déclenché (boutons "Envoyer les fichiers
  // maintenant" ci-dessous, même patron que CitizenReportStep3/containers/Content.js) — un `ref`
  // plutôt qu'un state : cette correspondance n'a pas besoin de déclencher un re-rendu.
  const attachmentRecordsRef = useRef({});
  // Reflète, par fichier (clé = `.uri`), s'il a été effectivement envoyé au serveur — piloté par
  // le vrai `upload_status` WatermelonDB, relu après chaque tentative d'envoi. Un fichier absent
  // de cette map (jamais encore tenté) est traité comme "non envoyé", donc rouge.
  const [attachmentUploadStatuses, setAttachmentUploadStatuses] = useState({});
  const isAttachmentUploaded = (uri) => attachmentUploadStatuses[uri] === 'done';
  const attachmentStatusColor = (uri) => (isAttachmentUploaded(uri) ? colors.primary : colors.error);


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


  // const getImageSize = async (imageUri) => {
  //   let fileSizeInMB = 0;
  //   try {
  //     const fileInfo = await FileSystem.getInfoAsync(imageUri);
  //     const fileSizeInBytes = fileInfo.size;
  //     fileSizeInMB = fileSizeInBytes ? fileSizeInBytes / (1024 * 1024) : 0; // Convert bytes to MB
  //   } catch (error) {
  //     console.error('Error getting image size:', error);
  //   }
  //   return fileSizeInMB;
  // };

  const startRecording = async () => {
    if (recordingURIs.length < 4) {
      try {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        const recording = new Audio.Recording();
        // `Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY` n'existe pas dans cette version d'expo-av
        // (le vrai chemin est `Audio.RecordingOptionsPresets.HIGH_QUALITY`) : l'expression valait
        // donc `undefined`, et `prepareToRecordAsync(undefined)` retombe silencieusement sur son
        // défaut interne `RecordingOptionsPresets.LOW_QUALITY` — sur Android, ce préréglage encode
        // en AMR_NB dans un conteneur `.3gp` au lieu d'AAC/`.m4a`, un format qu'aucun lecteur
        // (ExoPlayer mobile comme navigateur web du dashboard) ne peut lire de façon fiable. Toutes
        // les captures audio étaient donc enregistrées en basse qualité 3GP par accident.
        await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        await recording.startAsync();
        setRecording(recording);
      } catch (err) {
        // console.error("Failed to start recording", err);
      }
    } else {
      ToastAndroid.show(`${t('error_message_for_limit_audio')}`, ToastAndroid.SHORT);
    }
  };

  const stopRecording = async () => {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    const d = await getAudioDuration(uri);
    setRecordingURI(uri);
    setRecordingURIs([...recordingURIs, { uri: uri, duration: formatDuration(d), isAudio: true, id: new Date() }]);
    setRecording(undefined);
  };

  const onPlaybackStatusUpdate = (status) => {
    setDuration(status.durationMillis);
    setPosition(status.positionMillis);

    if (status.didJustFinish) {
      setSound(undefined);
      setSoundUrl(undefined);
    }
  }


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

    discardPersistedAttachment(recording_url);
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

  const get_image_manipulate = async (localUri, width, height) => {
    let manipResult;
    const imageSize = await getImageSize(localUri);

    if (!height || !width) {
      const dimensions = await getImageDimensions(localUri);
      width = dimensions.width ?? width;
      height = dimensions.height ?? height;
    }

    if (imageSize && imageSize > 1) {
      manipResult = await ImageManipulator.manipulateAsync(
        localUri,
        [{ resize: { width: width, height: height } }],
        { compress: image_compress(imageSize) }
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
  };
  function removeAttachment(index) {
    setIsSyncing(false);
    const removed = attachments[index];
    discardPersistedAttachment(removed?.uri || removed?.local_url);
    const array = [...attachments];
    array.splice(index, 1);
    setAttachments(array);
  }

  //End Media

  // Crée un enregistrement `Attachment` WatermelonDB (upload automatique par
  // src/files/uploadQueue.js au prochain runSync) à partir d'un fichier local picker/enregistré.
  // Idempotent via `attachmentRecordsRef` : si un envoi manuel ("Envoyer les fichiers maintenant")
  // a déjà créé (et potentiellement déjà envoyé) l'enregistrement pour ce fichier, on le réutilise
  // tel quel au lieu d'en recréer un doublon — `issueId` est déjà correct dès la création ici
  // (contrairement à CitizenReportStep3, l'issue existe déjà quand on agit dessus), donc aucun
  // rattachement supplémentaire n'est nécessaire au moment de la soumission finale.
  const persistAttachment = async (localFile, contentTypeHint) => {
    const localUri = localFile.uri || localFile.local_url;
    const existingRecordId = attachmentRecordsRef.current[localUri];
    if (existingRecordId) {
      return database.get('attachments').find(existingRecordId);
    }
    const record = await createWithId(database.get('attachments'), (a) => {
      a.issueId = issueRecord.id;
      a.fileName = (localUri || '').split('/').pop();
      a.contentType = localFile.mimeType || contentTypeHint || 'application/octet-stream';
      a.localUri = localUri;
      a.uploadStatus = 'pending';
      a.downloadStatus = 'done';
    });
    attachmentRecordsRef.current[localUri] = record.id;
    return record;
  };

  // Affiche un retour succès/échec après une tentative d'envoi manuel, en relisant le statut réel
  // des enregistrements concernés (un envoi peut avoir partiellement échoué, ex. hors-ligne) — et
  // met à jour la couleur (verte/rouge) des vignettes en conséquence.
  const reportAttachmentsUploadResult = async (localFiles) => {
    const uriRecordPairs = localFiles
      .map((f) => [f.uri || f.local_url, attachmentRecordsRef.current[f.uri || f.local_url]])
      .filter(([, recordId]) => recordId);
    const records = await Promise.all(
      uriRecordPairs.map(([, recordId]) => database.get('attachments').find(recordId)),
    );
    setAttachmentUploadStatuses((prev) => ({
      ...prev,
      ...Object.fromEntries(uriRecordPairs.map(([uri], i) => [uri, records[i].uploadStatus])),
    }));
    const anyError = records.some((r) => r.uploadStatus === 'error');
    ToastAndroid.show(t(anyError ? 'attachments_upload_deferred' : 'attachments_synchronized'), ToastAndroid.SHORT);
  };

  // Envoi manuel vers le serveur, avant même la soumission finale du modal (utile pour des fichiers
  // volumineux — photo/audio/PDF — qui partent déjà pendant que l'utilisateur finit de rédiger son
  // commentaire). Réutilisé par les 3 modals ci-dessous (RECORD STEPS/ESCALATE/RECORD RESOLUTION),
  // chacun avec ses propres fichiers locaux. `items` : liste de `{ file, contentTypeHint }` — un
  // hint par fichier plutôt qu'un seul hint global, indispensable pour RECORD STEPS qui mélange
  // photos et enregistrements audio dans un seul envoi.
  const uploadAttachmentsNow = async (items) => {
    const validItems = items.filter((it) => it && it.file);
    if (validItems.length === 0 || uploadingAttachments) return;
    setUploadingAttachments(true);
    try {
      for (const { file, contentTypeHint } of validItems) {
        await persistAttachment(file, contentTypeHint);
      }
      // Feedback dédié ci-dessous : pas besoin du toast générique d'échec.
      await enqueuePendingUploads({ notifyOnError: false });
      await reportAttachmentsUploadResult(validItems.map((it) => it.file));
    } catch (err) {
      console.warn(err);
      ToastAndroid.show(t('attachments_upload_deferred'), ToastAndroid.SHORT);
    } finally {
      setUploadingAttachments(false);
    }
  };

  const uploadRecordStepsAttachmentsNow = () => uploadAttachmentsNow([
    ...attachments.map((file) => ({ file, contentTypeHint: 'image/jpeg' })),
    ...recordingURIs.map((file) => ({ file, contentTypeHint: 'audio/m4a' })),
  ]);
  const uploadEscalatePDFNow = () => uploadAttachmentsNow([{ file: escalatePDF, contentTypeHint: 'application/pdf' }]);
  const uploadResolvePDFNow = () => uploadAttachmentsNow([{ file: resolvePDF, contentTypeHint: 'application/pdf' }]);

  // Supprime, le cas échéant, l'enregistrement `Attachment` déjà créé pour ce fichier via un envoi
  // manuel — sinon il resterait orphelin (`issue_id` déjà rempli mais jamais rattaché à une raison/
  // un commentaire) jusqu'au nettoyage automatique `cleanup_orphan_attachments` (CLAUDE.md §8).
  const discardPersistedAttachment = (localUri) => {
    const recordId = localUri && attachmentRecordsRef.current[localUri];
    if (!recordId) return;
    database.get('attachments').find(recordId)
      .then(async (record) => {
        // Répercute la suppression côté serveur AVANT de supprimer l'enregistrement local — sans
        // ça, `attachments` n'étant pas poussée par le protocole de sync habituel (cf.
        // files/uploadQueue.js::deleteAttachmentRemote), le fichier resterait orphelin côté
        // serveur indéfiniment si ce retrait intervient après un envoi manuel réussi.
        await deleteAttachmentRemote(record);
        await database.write(() => record.markAsDeleted());
      })
      .catch(() => {});
    delete attachmentRecordsRef.current[localUri];
  };

  const clearResolvePDF = () => {
    discardPersistedAttachment(resolvePDF?.uri);
    setResolvePDF();
  };

  const clearEscalatePDF = () => {
    discardPersistedAttachment(escalatePDF?.uri);
    setEscalatePDF();
  };

  const addComment = async (commentText) => {
    await createWithId(database.get('comments'), (r) => {
      r.issueId = issueRecord.id;
      r.authorId = eadl?.representative?.id;
      r.authorName = eadl?.representative?.name;
      r.comment = commentText;
      r.dueAt = new Date();
    });
  };

  const createStatusStory = async (statusRecordId, commentMessage) => {
    if (!statusRecordId) return;
    await createWithId(database.get('issue_status_stories'), (r) => {
      r.issueId = issueRecord.id;
      r.statusId = statusRecordId;
      r.userId = eadl?.representative?.id;
      r.userFullName = eadl?.representative?.name;
      r.comment = commentMessage;
      r.datetime = new Date();
    });
  };

  const issue_status_stories = async (status, coment_message) => {
    const statusRecordId = await resolveReferenceId('issue_statuses', status?.id);
    await createStatusStory(statusRecordId, coment_message);
    //Check Issues to sync (new issues, escalade issues, assignment)
    check_issues(null, eadl, i18n.language);
  };

  const acceptIssue = async () => {
    const newStatus = statuses.find((x) => x.open_status === true);
    const commentText = ([3, 4, 5].includes(issue.status.id)) ? t('issue_was_re_opened') : t('issue_was_accepted');
    await addComment(commentText);
    await saveIssueStatus(newStatus, 'accept');
    await issue_status_stories(newStatus, `${commentText}` + ((reason && reason?.trim() != '') ? ` [${reason}]` : ''));
  };

  const rejectIssue = async () => {
    const newStatus = statuses.find((x) => x.rejected_status === true);
    await addComment(t('issue_was_rejected'));
    await saveIssueStatus(newStatus, 'reject');
    await issue_status_stories(newStatus, `${t('issue_was_rejected')}` + ((reason && reason?.trim() != '') ? ` [${reason}]` : ''));
  };


  const escalateIssue = async () => {
    let current_escalate_to = currentAdlObj?.escalate_to;

    if (current_escalate_to && !current_escalate_to.administrative_id) {
      ToastAndroid.show(`${t('error_message_for_update')}`, ToastAndroid.SHORT);
      return;
    }

    const nextLevel = await get_next_administrative_level(current_escalate_to);
    if (!nextLevel) {
      return; // erreur déjà signalée par get_next_administrative_level
    }
    let administrative_level_to_escalate = nextLevel.administrative_level;

    issue.escalate_flag = true;
    await database.write(async () => {
      await issueRecord.update((r) => { r.escalateFlag = true; });
    });

    let attachmentId = null;
    if (escalatePDF) {
      const attachmentRecord = await persistAttachment(escalatePDF, 'application/pdf');
      attachmentId = attachmentRecord.id;
      await createWithId(database.get('reasons'), (r) => {
        r.issueId = issueRecord.id;
        r.subject = 'escalation';
        r.userId = eadl?.representative?.id;
        r.userName = eadl?.representative?.name;
        r.dueAt = new Date();
        r.attachmentId = attachmentId;
      });
      setEscalatePDF();
    }

    await createWithId(database.get('escalation_reasons'), (er) => {
      er.issueId = issueRecord.id;
      er.userId = eadl?.representative?.id;
      er.userName = eadl?.representative?.name;
      er.comment = escalateComment;
      er.dueAt = new Date();
      er.attachmentId = attachmentId;
    });

    await addComment(`${t('issue_was_escalated')} ${t('escalate_to_label')} ${administrative_level_to_escalate == "Country" ? "Nation" : administrative_level_to_escalate}`);

    await createWithId(database.get('escalation_levels'), (el) => {
      el.issueId = issueRecord.id;
      el.administrativeLevel = administrative_level_to_escalate;
      el.administrativeId = nextLevel.administrative_id ? String(nextLevel.administrative_id) : null;
      el.name = nextLevel.name || null;
      el.dueAt = new Date();
    });

    setDisableEscalation(true);
    setEscalatedDialog(true);

    // La remontée réinitialise le statut à "En cours de traitement" (procédure §5).
    const newStatus = statuses.find((x) => x.open_status === true);
    await saveIssueStatus(newStatus, 'escalate');
    await issue_status_stories(newStatus, `${t('issue_was_escalated')}` + ((escalateComment && escalateComment.trim() != '') ? ` [${escalateComment}]` : ''));

    await get_current_adl_obj();

    setEscalateFlag(true);
  };

  const recordStep = async () => {
    let due_at = new Date();
    await addComment(comment);

    await createWithId(database.get('reasons'), (r) => {
      r.issueId = issueRecord.id;
      r.subject = 'comment';
      r.comment = comment;
      r.userId = eadl?.representative?.id;
      r.userName = eadl?.representative?.name;
      r.dueAt = due_at;
    });

    for (const att of attachments) {
      const attachmentRecord = await persistAttachment(att, 'image/jpeg');
      await createWithId(database.get('reasons'), (r) => {
        r.issueId = issueRecord.id;
        r.subject = 'file';
        r.userId = eadl?.representative?.id;
        r.userName = eadl?.representative?.name;
        r.dueAt = due_at;
        r.attachmentId = attachmentRecord.id;
      });
    }
    setAttachments([]);

    for (const rec of recordingURIs) {
      const attachmentRecord = await persistAttachment(rec, 'audio/m4a');
      await createWithId(database.get('reasons'), (r) => {
        r.issueId = issueRecord.id;
        r.subject = 'file';
        r.userId = eadl?.representative?.id;
        r.userName = eadl?.representative?.name;
        r.dueAt = due_at;
        r.attachmentId = attachmentRecord.id;
      });
    }
    setRecordingURIs([]);

    if (recordingURI) {
      setRecordingURI();
    }

    setRecordedSteps(true);

    const newStatus = statuses.find((x) => x.id === issue.status.id);
    await issue_status_stories(newStatus, comment);
  };

  const recordResolution = () => {
    setRecordedResolution(true);
  };

  const recordResolutionConfirmation = async () => {
    issue.research_result = resolution;
    const newStatus = statuses.find((x) => x.final_status === true);
    await addComment(t('issue_was_resolved'));

    let attachmentId = null;
    if (resolvePDF) {
      const attachmentRecord = await persistAttachment(resolvePDF, 'application/pdf');
      attachmentId = attachmentRecord.id;
      await createWithId(database.get('reasons'), (r) => {
        r.issueId = issueRecord.id;
        r.subject = 'resolution';
        r.userId = eadl?.representative?.id;
        r.userName = eadl?.representative?.name;
        r.dueAt = new Date();
        r.attachmentId = attachmentId;
      });
      setResolvePDF();
    }

    await saveIssueStatus(newStatus, 'record_resolution', { researchResult: resolution });
    _hideRecordResolutionDialog();
    await issue_status_stories(newStatus, `${t('issue_was_resolved')}` + ((resolution && resolution.trim() != '') ? ` [${resolution}]` : ''));
  };

  const notResolve = async () => {
    const newStatus = statuses.find((x) => x.unresolved_status === true);
    await addComment(t('issue_was_not_resolved'));
    await saveIssueStatus(newStatus, 'not_resolve');
    _hideNotresolveDialog();
    await issue_status_stories(newStatus, `${t('issue_was_not_resolved')}` + ((notResolutionComment && notResolutionComment.trim() != '') ? ` [${notResolutionComment}]` : ''));
  };

  const saveIssueStatus = async (newStatus, type = 'none', extraFields = {}) => {
    let statusRecordId = null;
    if (newStatus) {
      issue.status = {
        id: newStatus.id,
        name: newStatus.name,
      };
      statusRecordId = await resolveReferenceId('issue_statuses', newStatus.id);
    }

    await database.write(async () => {
      await issueRecord.update((r) => {
        if (statusRecordId) r.statusId = statusRecordId;
        Object.assign(r, extraFields);
      });
    });

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
    // check_issues(null, eadl, i18n.language);
  };

  // Dérive `isIssueAssignedToMe`/`citizenName`/`escalateFlag` de `issue` (le dict "legacy shape",
  // cf. utils/issueLegacyShape.js) — extrait en fonction réutilisable pour pouvoir être rejoué
  // après un rafraîchissement (`onRefresh` ci-dessous), pas seulement au montage : `issue` est un
  // objet muté en place (jamais remplacé par une nouvelle référence), donc un `useEffect` avec
  // `issue` en dépendance ne se redéclenche jamais tout seul après une mutation in-place — il faut
  // explicitement rejouer cette logique après chaque rafraîchissement des données.
  const refreshAssigneeDerivedState = () => {
    function _isIssueAssignedToMe() {
      if (issue.assignee && issue.assignee.id) {
        return issue.assignee.id === eadl.representative?.id;
      }
    }
    const assignedToMe = _isIssueAssignedToMe();
    setIsIssueAssignedToMe(assignedToMe);

    if (issue.citizen_type !== 1) {
      setCitizenName(issue.citizen);
    } else if (issue.citizen_type === 1) {
      setCitizenName(assignedToMe ? issue.citizen : 'Anonymous');
    }

    setEscalateFlag(!!issue.escalate_flag);
  };

  useEffect(() => {
    refreshAssigneeDerivedState();
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

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
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
                  color={isNotResolveEnabled ? colors.error : colors.disabled}
                />
                <Feather name="help-circle" size={24} color="gray" />
              </View>
            </TouchableOpacity>
            {/* End Not resolve */}
          </View>
          <TouchableOpacity
            onPress={_showEscalateDialog}
            disabled={issue.status.id !== 5 || currentAdlObj.escalate_to.administrative_level == "Country" || escalateFlag}
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
                        source={escalatePDF.mimeType && escalatePDF.mimeType.includes('pdf') ? require('../../../../../assets/pdf.png') : { uri: escalatePDF.uri }}
                        style={{
                          height: 80,
                          width: 80,
                          marginHorizontal: 1,
                          alignSelf: 'center',
                          justifyContent: 'flex-end',
                          marginVertical: 20,
                          borderWidth: 3,
                          borderColor: attachmentStatusColor(escalatePDF.uri),
                        }}
                      >
                        <TouchableOpacity
                          onPress={clearEscalatePDF}
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
                      onPress={() => { pickDocument(false, false, true) }}
                      uppercase={false}
                    >
                      {t('attach_pv')}
                    </Button>
                  </View>
                  {escalatePDF && (
                    <Button
                      compact
                      theme={theme}
                      mode="outlined"
                      uppercase={false}
                      disabled={uploadingAttachments}
                      loading={uploadingAttachments}
                      style={{ alignSelf: 'flex-start', marginTop: 10, borderColor: colors.primary }}
                      labelStyle={{ color: colors.primary, fontFamily: 'Poppins_400Regular', fontSize: 13 }}
                      onPress={uploadEscalatePDFNow}
                    >
                      {t('upload_files_now')}
                    </Button>
                  )}
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
                        let urlL = attachment.local_url || attachment.uri;

                        return (
                          <ImageBackground
                            key={`${attachment.id}_${urlL}`}
                            source={(urlL && urlL.includes('.pdf')) ? require('../../../../../assets/pdf.png') : { uri: urlL }}
                            style={{
                              height: 80,
                              width: 80,
                              marginHorizontal: 1,
                              alignSelf: 'center',
                              justifyContent: 'flex-end',
                              marginVertical: 20,
                              borderWidth: 3,
                              borderColor: attachmentStatusColor(attachment.uri),
                            }}
                          >
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
                {recordingURIs && recordingURIs.map((recording_url, index) => {
                  let audio_url = recording_url.local_url || recording_url.uri;
                  let audio_url_split = audio_url.split("?")[0].split("/");
                  let audio_file_name = audio_url_split[audio_url_split.length - 1];

                  let audio_url_current = soundUrl || "";
                  let audio_url_split_current = audio_url_current.split("?")[0].split("/");
                  let audio_file_name_current = audio_url_split_current[audio_url_split_current.length - 1];

                  return (
                    <View
                      key={audio_url}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderLeftWidth: 4,
                        borderLeftColor: attachmentStatusColor(recording_url.uri || audio_url),
                      }}
                    >
                      <IconButton icon={!soundOnPause && audio_file_name_current == audio_file_name ? "pause" : "play"} iconColor={colors.primary} size={24} onPress={
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
                      <IconButton
                        icon="close"
                        iconColor={colors.error}
                        size={24}
                        onPress={() => reomveARecordingURI(audio_url)}
                      />
                    </View>
                  )
                })}
                {(attachments.length > 0 || recordingURIs.length > 0) && (
                  <Button
                    compact
                    theme={theme}
                    mode="outlined"
                    uppercase={false}
                    disabled={uploadingAttachments}
                    loading={uploadingAttachments}
                    style={{ alignSelf: 'flex-start', marginTop: 10, marginLeft: 5, borderColor: colors.primary }}
                    labelStyle={{ color: colors.primary, fontFamily: 'Poppins_400Regular', fontSize: 13 }}
                    onPress={uploadRecordStepsAttachmentsNow}
                  >
                    {t('upload_files_now')}
                  </Button>
                )}
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
                        source={resolvePDF.mimeType && resolvePDF.mimeType.includes('pdf') ? require('../../../../../assets/pdf.png') : { uri: resolvePDF.uri }}
                        style={{
                          height: 80,
                          width: 80,
                          marginHorizontal: 1,
                          alignSelf: 'center',
                          justifyContent: 'flex-end',
                          marginVertical: 20,
                          borderWidth: 3,
                          borderColor: attachmentStatusColor(resolvePDF.uri),
                        }}
                      >
                        <TouchableOpacity
                          onPress={clearResolvePDF}
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
                      onPress={() => { pickDocument(false, true) }}
                      uppercase={false}
                    >
                      {t('attach_pv')}
                    </Button>
                  </View>
                  {resolvePDF && (
                    <Button
                      compact
                      theme={theme}
                      mode="outlined"
                      uppercase={false}
                      disabled={uploadingAttachments}
                      loading={uploadingAttachments}
                      style={{ alignSelf: 'flex-start', marginTop: 10, borderColor: colors.primary }}
                      labelStyle={{ color: colors.primary, fontFamily: 'Poppins_400Regular', fontSize: 13 }}
                      onPress={uploadResolvePDFNow}
                    >
                      {t('upload_files_now')}
                    </Button>
                  )}
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

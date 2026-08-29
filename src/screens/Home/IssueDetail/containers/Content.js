import { MaterialCommunityIcons, AntDesign, Feather } from '@expo/vector-icons';
import { useBackHandler } from '@react-native-community/hooks';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import moment from 'moment';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  Image, Platform, ScrollView, Text, TouchableOpacity,
  View, FlatList, SafeAreaView, RefreshControl, Alert,
  StyleSheet, Animated, ImageBackground, ProgressBarAndroid
} from 'react-native';
import Collapsible from 'react-native-collapsible';
import { Button, IconButton, Divider, Dialog, Paragraph, Portal, ActivityIndicator } from 'react-native-paper';
import * as Linking from 'expo-linking';
import Share from 'react-native-share';
import CustomSeparator from '../../../../components/CustomSeparator/CustomSeparator';
import { colors } from '../../../../utils/colors';
import { database } from '../../../../database';
import { createWithId } from '../../../../database/utils/createWithId';
import { runSyncSafely } from '../../../../database/watermelonSyncManager';
import { useSyncCompletion } from '../../../../database/useSyncCompletion';
import { toLegacyIssueShape } from '../../../../utils/issueLegacyShape';
import { getUserDocs } from '../../../../utils/databaseManager';
import { citizenTypes } from '../../../../utils/utils';
import { styles } from './Content.styles';
import API from '../../../../services/API';
import CustomDropDownPickerWithRender from '../../../../components/CustomDropDownPicker/CustomDropDownPicker';
import { setCommune, setDocument } from '../../../../store/ducks/userDocument.duck';
import UpdatableList from "../../../../components/UpdatableList";
import AttachmentViewerModal from '../../../../components/AttachmentViewerModal/AttachmentViewerModal';
import { downloadAttachmentById } from '../../../../files/downloadQueue';
import { formatDuration, getAudioDuration } from '../../../../utils/functions';



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

// Convertit un enregistrement `Attachment` WatermelonDB vers la forme legacy attendue par le JSX
// existant (`url`/`local_url`/`isAudio`), qui distinguait auparavant les pièces jointes audio via
// l'extension `.3gp` dans l'URL CouchDB — on utilise désormais directement `content_type`.
function attachmentToLegacy(attachment) {
  if (!attachment) return null;
  return {
    id: attachment.id,
    url: attachment.remoteUrl,
    local_url: attachment.localUri,
    uri: attachment.localUri || attachment.remoteUrl,
    isAudio: !!(attachment.contentType && attachment.contentType.startsWith('audio/')),
    name: attachment.fileName,
  };
}


function Content({ issue }) {
  const { t } = useTranslation();
  const issueRecord = issue.record;

  const [comments, setComments] = useState([]);
  const [isIssueAssignedToMe, setIsIssueAssignedToMe] = useState(false);
  const [currentDate, setCurrentDate] = useState(moment());
  const [newComment, setNewComment] = useState();
  const [isDescriptionCollapsed, setIsDescriptionCollapsed] = useState(true);
  const [isResolveDescritionCollapsed, setIsResolveDescritionCollapsed] = useState(true);
  const [isDecisionCollapsed, setIsDecisionCollapsed] = useState(true);
  const [isSatisfactionCollapsed, setIsSatisfactionCollapsed] = useState(true);
  const [isAppealCollapsed, setIsAppealCollapsed] = useState(true);
  const [sound, setSound] = useState();
  const [soundOnPause, setSoundOnPause] = useState(false);
  const [soundUrl, setSoundUrl] = React.useState();
  const [duration, setDuration] = useState(null);
  const [position, setPosition] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [issueAttachments, setIssueAttachments] = useState([]);
  const [issueReasons, setIssueReasons] = useState([]);
  const [resolutionFiles, setResolutionFiles] = useState([]);

  // Visionneuse plein écran (image/PDF) — le téléchargement n'est plus automatique (cf.
  // files/downloadQueue.js) : la visionneuse affiche directement `remote_url` à la volée quand
  // rien n'est encore présent localement, sans avoir besoin de télécharger le fichier.
  const [viewerAttachment, setViewerAttachment] = useState(null);
  const [downloadingIds, setDownloadingIds] = useState(() => new Set());

  const [playing, setPlaying] = useState(false);

  const [editLocationDialog, setEditLocationDialog] = useState(false);
  const _showEditLocationDialog = () => setEditLocationDialog(true);
  const _hideEditLocationDialog = () => setEditLocationDialog(false);

  const scrollViewRef = useRef();

  //Adminstrative
  const dispatch = useDispatch();
  const { username } = useSelector((state) => state.get('authentication').toObject());
  const { userDocument: eadl, userCommune } = useSelector((state) => state.get('userDocument').toObject());

  const [cantons, setCantons] = useState(null);
  const [villages, setVillages] = useState(null);
  const [canton, setCanton] = useState(null);
  const [cantonsItems, setCantonsItems] = useState(null);
  const [selectedCanton, setSelectedselectedCanton] = useState(null);
  const [village, setVillage] = useState(null);
  const [villagesItems, setVillagesItems] = useState(null);
  const [selectedVillage, setSelectedselectedVillage] = useState(null);
  const [hideCantonField, setHideCantonField] = useState(true);
  const [hideVillageField, setHideVillageField] = useState(true);
  const [open, setOpen] = useState(false);
  const [openVillage, setOpenVillage] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // `Relation.fetch()` rejette (RecordNotFoundError) si la pièce jointe référencée par un
  // `Reason` n'est pas encore présente localement (ex. pull pas encore effectué depuis l'ajout
  // du fix de synchronisation des attachments) — sans ce garde, un seul enregistrement manquant
  // faisait échouer tout le `Promise.all` englobant, vidant silencieusement la preuve de
  // résolution ET les décisions/investigations (jamais juste l'entrée concernée).
  const fetchAttachmentSafely = async (reasonRecord) => {
    if (!reasonRecord.attachmentId) return null;
    try {
      return await reasonRecord.attachment.fetch();
    } catch (err) {
      return null;
    }
  };

  // Charge les tables enfants WatermelonDB (comments/reasons/attachments) de l'issue — ces
  // tableaux n'existent plus dans le document lui-même (cf. src/utils/issueLegacyShape.js).
  const loadIssueChildren = useCallback(async () => {
    const [commentRecords, reasonRecords, attachmentRecords] = await Promise.all([
      issueRecord.comments.fetch(),
      issueRecord.reasons.fetch(),
      issueRecord.attachments.fetch(),
    ]);

    commentRecords.sort((a, b) => (b.dueAt?.getTime() || 0) - (a.dueAt?.getTime() || 0));
    const legacyComments = commentRecords.map((c) => ({
      name: c.authorName,
      comment: c.comment,
      due_at: c.dueAt,
    }));
    issue.comments = legacyComments;
    setComments(legacyComments);

    const linkedAttachmentIds = new Set(
      reasonRecords.filter((r) => r.attachmentId).map((r) => r.attachmentId)
    );
    // `getAudioDuration` est asynchrone (elle joue le fichier via expo-av pour lire sa durée) :
    // sans `await`, `formatDuration` recevait la Promise elle-même au lieu du nombre de secondes,
    // d'où un `duration_f` affichant systématiquement "NaN:NaN" quel que soit le résultat réel.
    const topLevelAttachments = (await Promise.all(
      attachmentRecords
        .filter((a) => !linkedAttachmentIds.has(a.id))
        .map(attachmentToLegacy)
        .map(async (att) => (att ? { duration_f: formatDuration(await getAudioDuration(att.uri)), ...att } : null))
    )).filter(Boolean);
    issue.attachments = topLevelAttachments;
    setIssueAttachments(topLevelAttachments);

    const resolutionReasonRecords = reasonRecords.filter((r) => r.subject === 'resolution');
    const resolutionFilesList = (await Promise.all(
      resolutionReasonRecords.map(async (r) => {
        const att = await fetchAttachmentSafely(r);
        return att ? { id: r.id, duration_f: formatDuration(await getAudioDuration(att.uri)), ...attachmentToLegacy(att) } : null;
      })
    )).filter(Boolean);
    issue.resolution_files = resolutionFilesList;
    setResolutionFiles(resolutionFilesList);

    const otherReasonRecords = reasonRecords.filter((r) => r.subject !== 'resolution');
    const reasonsList = (await Promise.all(
      otherReasonRecords.map(async (r) => {
        if (r.subject === 'comment') {
          return { type: 'comment', id: r.id, user_name: r.userName, due_at: r.dueAt, comment: r.comment };
        }
        const att = await fetchAttachmentSafely(r);
        return att ? { type: 'file', id: r.id, due_at: r.dueAt, duration_f: formatDuration(await getAudioDuration(att.uri)), ...attachmentToLegacy(att) } : null;
      })
    )).filter(Boolean);
    issue.reasons = reasonsList;
    setIssueReasons(reasonsList);
  }, [issueRecord]);

  useEffect(() => {
    loadIssueChildren();
  }, [loadIssueChildren]);

  const setVillagesInfos = (hideC, c) => {
    let v = [];
    if ((villages && [0, 1].includes(villages.length)) || (hideC == false && c == null)) {
      setHideVillageField(true);
      if (villages && villages.length == 1) {
        setVillage(villages[0]);
        setSelectedselectedVillage(villages[0]);
      }
    } else {
      if (villages) {
        for (let i = 0; i < villages.length; i++) {
          if (c != null && c.id == villages[i].parent) {
            v.push({ name: String(villages[i].name), id: String(villages[i].id) });
          } else if (c == null) {
            v.push({ name: String(villages[i].name), id: String(villages[i].id) });
          }
          if (i + 1 == villages.length) {
            setVillagesItems(v);
          }
        }
      }
      setHideVillageField(false);
    }
  }

  const getAdministrativeLevels = () => {
    if(!issue.administrative_region?.name){
      setCantons(null);
      setVillages(null);
      // `return` : rend cet appel "attendable" par `onRefresh` ci-dessous (sinon `setRefreshing(false)`
      // s'exécutait avant même que la requête réseau ne parte, cf. l'ancien `onRefresh` synchrone).
      return new API().administrativeLevelsFilterByAdministrativeRegion(username, userCommune.administrative_id, {}).then((response) => {
        if (response.error) {
          // console.log(response.error);
          Alert.alert('Warning', response?.error?.toString(), [{ text: 'OK' }], {
            cancelable: false,
          });
          return;
        }
        setCantons(response.cantons);
        setVillages(response.villages);

        let d = [];
        if (cantons && villages && cantons.length == 0 && villages.length == 0) {
          setHideCantonField(true);
          setHideVillageField(true);
        } else if (cantons && [0, 1].includes(cantons.length)) {
          setHideCantonField(true);
          setVillagesInfos(true, canton);
        } else {
          setHideCantonField(false);
          setVillagesInfos(false, canton);
          if (cantons) {
            for (let i = 0; i < cantons.length; i++) {
              d.push({ name: String(cantons[i].name), id: String(cantons[i].id) });
              if (i + 1 == cantons.length) {
                setCantonsItems(d);
              }
            }
          }
        }
      }).catch((error) => {
        console.log(error);
      });
    }
  };



  useEffect(() => {
    const fetchUserCommune = async () => {
      if (!userCommune) {
        const { userDoc, userCommune: usrC } = await getUserDocs();
        if (userDoc) {
          dispatch(setDocument(userDoc)); // Dispatch setDocument action
        }
        if (usrC) {
          dispatch(setCommune(usrC)); // Dispatch setCommune action
        }
      }
    };
    fetchUserCommune(); // Call the fetch userCommune data function
  }, [dispatch, userCommune]);


  useEffect(() => {
    if (userCommune) {
      getAdministrativeLevels();
    }
  }, [userCommune]);

  // Relit la base locale (déjà à jour après un sync) et reconstruit l'affichage.
  // `issue` (le dict "legacy shape", cf. utils/issueLegacyShape.js) est construit UNE SEULE FOIS
  // par l'écran appelant (au moment de la navigation) puis muté en place ici — un sync met bien à
  // jour la ligne SQLite sous-jacente (`issueRecord`), mais rien ne rafraîchissait ensuite les
  // champs scalaires/relations de `issue` (statut, catégorie, assignation, description, résultat
  // de recherche...) à partir de `issueRecord` : `loadIssueChildren()` ne rafraîchit que les
  // tables enfants (commentaires, pièces jointes, raisons), pas l'issue elle-même. D'où la
  // reconstruction explicite ici. NE JAMAIS appeler `runSyncSafely()` ici : cette fonction est
  // aussi rejouée à la fin de chaque synchronisation automatique (cf. `useSyncCompletion`).
  const refreshFromLocal = async () => {
    Object.assign(issue, await toLegacyIssueShape(issueRecord));
    refreshAssigneeDerivedState();
    await Promise.all([getAdministrativeLevels(), loadIssueChildren()]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Récupère d'abord les dernières données du serveur avant de relire la base locale : sans
      // ce sync, "tirer pour rafraîchir" ne faisait que ré-afficher le même instantané local.
      runSyncSafely();
      // Correctif au passage : `setRefreshing(false)` s'exécutait auparavant immédiatement après
      // avoir déclenché des appels asynchrones sans les attendre, donc avant même qu'ils n'aient
      // eu le temps de partir — l'indicateur de chargement disparaissait donc instantanément au
      // lieu de refléter la vraie durée du rafraîchissement.
      await refreshFromLocal();
    } catch (err) {
      console.log(err);
    } finally {
      setRefreshing(false);
    }
  };

  // Quand une synchronisation automatique (intervalle, retour réseau, retour au premier plan) se
  // termine pendant que l'écran est ouvert, on relit la base locale pour afficher les nouvelles
  // mises à jour sans que l'utilisateur ait à tirer pour rafraîchir.
  useSyncCompletion(refreshFromLocal);

  const saveADLIssue = async () => {
    // `administrative_region` est requis côté serveur (sync/serializers.py::IssueSyncSerializer,
    // required=True) : pousser `null` sur une issue existante ferait échouer toute la
    // synchronisation (la validation DRF n'est pas rattrapée par PushView), sans qu'aucun message
    // clair ne soit montré à l'agent avant ce moment. On bloque donc localement plutôt que de
    // laisser `selectedVillage` vide partir en sync.
    if (!selectedVillage?.id) {
      Alert.alert('Erreur', "Veuillez sélectionner un village avant d'enregistrer.");
      return;
    }

    const issueLocation = {
      administrative_id: selectedVillage.id,
      name: selectedVillage.name,
    };
    issue.location_info = {
      ...issue.location_info,
      issue_location: issueLocation,
    };
    issue.administrative_region = issueLocation;

    await database.write(async () => {
      await issueRecord.update((r) => {
        r.administrativeRegionId = Number(selectedVillage.id);
        r.administrativeRegionName = selectedVillage.name;
        r.locationInfo = issue.location_info;
      });
    });

    _hideEditLocationDialog();
    onRefresh();
  };
  //End Administrative




  useBackHandler(
    () =>
      // navigation.navigate("GRM")
      // handle it
      true
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

  // Extrait en fonction réutilisable (rejouée aussi par `onRefresh` ci-dessous) : `issue` est un
  // objet muté en place (jamais remplacé par une nouvelle référence, cf. `toLegacyIssueShape`
  // plus bas), donc un `useEffect` dépendant de `issue` ne se redéclencherait jamais tout seul
  // après une telle mutation — il faut explicitement rejouer cette logique après chaque
  // rafraîchissement des données.
  const refreshAssigneeDerivedState = () => {
    function _isIssueAssignedToMe() {
      if (issue.assignee && issue.assignee.id) {
        return issue.assignee.id === eadl?.representative?.id;
      }
    }

    setIsIssueAssignedToMe(_isIssueAssignedToMe());
  };

  useEffect(() => {
    refreshAssigneeDerivedState();
  }, []);

  const openAttachment = async (item) => {
    try {
      setIsSyncing(true);
      if (item.local_url) {
        await Share.open({ url: item.local_url });
      } else if (item.url) {
        await Linking.openURL(item.url.split('?')[0]);
      } else if (item.uri) {
        await Linking.openURL(item.uri.split('?')[0]);
      }
    } catch (err) {
      console.log('Error opening attachment', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Ouvre la visionneuse plein écran (image/PDF) — affiche directement `local_url` si déjà
  // téléchargé, sinon `url` (distant) à la volée, sans nécessiter de téléchargement préalable.
  const openAttachmentViewer = (item) => {
    const uri = (item?.local_url || item?.url || item?.uri || '').split("?")[0];
    if (!uri) return;
    setViewerAttachment({
      item,
      uri,
      isPdf: uri.includes('.pdf'),
      name: item?.name,
      isLocal: !!item?.local_url,
    });
  };

  // Téléchargement à la demande d'UNE pièce jointe (icône dédiée) — plus aucun téléchargement
  // automatique en arrière-plan (cf. database/sync.js::runSync, files/downloadQueue.js).
  const handleDownloadAttachment = async (item) => {
    if (!item?.id || item.local_url || !item.url) return;
    setDownloadingIds((prev) => new Set(prev).add(item.id));
    try {
      const localUri = await downloadAttachmentById(item.id);
      setViewerAttachment((prev) => (
        prev && prev.item?.id === item.id ? { ...prev, uri: localUri, isLocal: true } : prev
      ));
      await loadIssueChildren();
    } catch (err) {
      console.warn('Download failed for', item.name, err);
      Alert.alert(t('file_read_error'), t('file_read_error_try_again'));
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const onAddComment = async () => {
    if (newComment) {
      await createWithId(database.get('comments'), (c) => {
        c.issueId = issueRecord.id;
        c.authorId = eadl?.representative?.id;
        c.authorName = eadl?.representative?.name;
        c.comment = newComment;
        c.dueAt = new Date();
      });

      setNewComment('');
      await loadIssueChildren();
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }
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

  const renderItemReason = ({ item, index }) => {
    if (item.type == "comment") {
      return (
        <View key={index} style={{ borderColor: 'grey', borderWidth: 2, width: 300, height: 200 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
            <View style={styles.greenCircle} />
            <View>
              <Text style={styles.radioLabel}>{item.user_name}</Text>
              <Text style={styles.radioLabel}>{moment(item.due_at).format('DD-MMM-YYYY')}</Text>
            </View>
          </View>
          <Text style={styles.stepNote}>{item.comment}</Text>
        </View>
      );
    } else {
      let urlL = (item.local_url || item.url || item.uri || '').split("?")[0];

      let audio_url = urlL;
      let audio_url_split = (audio_url || '').split("?")[0].split("/");
      let audio_file_name = audio_url_split[audio_url_split.length - 1];

      let audio_url_current = soundUrl || "";
      let audio_url_split_current = audio_url_current.split("?")[0].split("/");
      let audio_file_name_current = audio_url_split_current[audio_url_split_current.length - 1];

      return (
        <View key={`${index}_${item.url ?? item.local_url}`} style={{ width: 250, height: 200 }}>
          {item.isAudio ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                alignSelf: 'center',
                marginVertical: 20,
                margin: 'auto'
              }}
            >
              <IconButton icon={!soundOnPause && audio_file_name_current == audio_file_name ? "pause" : "play"} iconColor={colors.primary} size={24} onPress={
                () => audio_file_name_current == audio_file_name ? (soundOnPause ? playASoundOnCurrentPause() : pauseASound()) : playASound(audio_url)
              } />
              <View style={styles_audio.container}>
                <Animated.View style={[styles_audio.bar, { width: audio_file_name_current == audio_file_name ? getProgress() ?? 0 : 0 }]} />
              </View>
              {/* <Text
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
              </Text> */}
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
              >{parseInt(String(audio_file_name_current == audio_file_name && position ? position / 1000 : 0))}{item?.duration_f ? `/${item?.duration_f}` : ''}</Text>
            </View>
          ) : (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}>

              <View style={{ flex: 1, flexDirection: 'row' }}>
                <ImageBackground
                  key={`${item.id} ${urlL}`}
                  source={(urlL && urlL.includes('.pdf')) ? require('../../../../../assets/pdf.png') : { uri: urlL }}
                  style={{
                    height: 200,
                    width: 200,
                    marginHorizontal: 1,
                    alignSelf: 'flex-start',
                    justifyContent: 'flex-end',
                    marginVertical: 20,
                  }}
                >

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <TouchableOpacity
                      onPress={() => openAttachmentViewer(item)}
                      style={{
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.5)',
                      }}
                    >
                      <Image
                        resizeMode="stretch"
                        style={{ width: 75, height: 75, borderRadius: 50, marginBottom: 5 }}
                        source={require('../../../../../assets/eye.png')}
                      />
                    </TouchableOpacity>
                    {!item.local_url && item.url && (
                      <IconButton
                        icon={downloadingIds.has(item.id) ? 'progress-download' : 'download'}
                        iconColor={colors.primary}
                        size={24}
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
                        disabled={downloadingIds.has(item.id)}
                        onPress={() => handleDownloadAttachment(item)}
                      />
                    )}
                  </View>

                </ImageBackground>
              </View>
            </View>
          )}

        </View>
      );
    }

  };

  return (
    <ScrollView ref={scrollViewRef} contentContainerStyle={{ alignItems: 'center', padding: 20 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <View style={styles.infoContainer}>
        <View style={{ flexDirection: 'row' }}>
          <View
            style={{ marginBottom: 10, justifyContent: 'flex-end', flex: 1, flexDirection: 'row' }}
          >
            <Text style={[styles.text, { fontSize: 12, color: colors.primary }]}>
              {' '}
              {issue.issue_date && moment(issue.issue_date).format('DD-MMM-YYYY')}{' '}
              {issue.issue_date && currentDate.diff(issue.issue_date, 'days')} {t('days_ago')}
            </Text>
          </View>
        </View>
        <View
          style={{
            flexDirection: 'row',
            flex: 1,
            justifyContent: 'space-between',
            marginTop: 10,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.subtitle}>
              {t('lodged_by')}
              <Text style={styles.text}>
                {' '}
                {citizenTypes[issue.citizen_type] ?? t('information_not_available')}
              </Text>
            </Text>
            <Text style={styles.subtitle}>
              {t('name')}
              <Text style={styles.text}>
                {' '}
                {issue.citizen_type === 1 && !isIssueAssignedToMe
                  ? t('confidential')
                  : issue.citizen}
              </Text>
            </Text>
            <Text style={styles.subtitle}>
              {t('age')}{' '}
              <Text style={styles.text}>
                {' '}
                {issue.citizen_type === 1 && !isIssueAssignedToMe
                  ? t('confidential')
                  : issue.citizen_age_group?.name ?? t('information_not_available')}
              </Text>
            </Text>

            <Text style={styles.subtitle}>
              {
                issue.citizen_type === 1 && !isIssueAssignedToMe ?
                  <>
                    <Text style={styles.subtitle}>
                      {t('location')}{' '}
                      <Text style={styles.text}>
                        {' '} {t('confidential')}
                      </Text>
                    </Text>
                  </>
                  :
                  issue.administrative_region?.name ?
                    <>
                      <Text style={styles.subtitle}>
                        {t('location')}{' '}
                        <Text style={styles.text}>{' '} {issue.administrative_region?.name}</Text>
                      </Text>
                    </>
                    : <>
                      <TouchableOpacity
                        onPress={_showEditLocationDialog}
                        style={{
                          alignItems: 'center',
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          marginVertical: 10
                        }}
                      >
                        <Text style={styles.subtitle}>
                          {t('location')}{' '}
                          <Text style={styles.text}>{t('information_not_available')}</Text>
                          <View
                            style={{ flexDirection: 'row', alignItems: 'center' }}
                          >
                            {(cantons == null || villages == null) ?
                              <ActivityIndicator color={colors.primary} size="small" />
                              : <AntDesign
                                // style={{ marginRight: 5 }}
                                name="rightsquare"
                                size={18}
                                color={colors.primary}
                              />}

                          </View>
                        </Text>

                      </TouchableOpacity>
                    </>
              }
            </Text>
            <Text style={styles.subtitle}>
              {t('category')}{' '}
              <Text style={styles.text}>
                {' '}
                {issue.category?.name ?? t('information_not_available')}
              </Text>
            </Text>
            <Text style={styles.subtitle}>
              {t('assigned_to')}{' '}
              <Text style={styles.text}> {issue.assignee?.name ?? 'Pending Assigment'}</Text>
            </Text>
            {issue.structure_in_charge &&
              (issue.structure_in_charge.name || issue.structure_in_charge.phone || issue.structure_in_charge.email) ?
              <Text style={styles.subtitle}>
                {t('step_2_structure_in_charge')}{' '}
                <Text style={styles.text}>
                  {issue.structure_in_charge.name ?? '-'}
                  {issue.structure_in_charge.phone ? ` | ${issue.structure_in_charge.phone}` : ''}
                  {issue.structure_in_charge.email ? ` | ${issue.structure_in_charge.email}` : ''}
                </Text>
              </Text> : <></>}
            {issueAttachments?.length > 0 &&
              issueAttachments.map((item, index) => {
                let urlL = (item.local_url || item.url || item.uri || '').split("?")[0];
                
                let audio_url = urlL;
                let audio_url_split = (audio_url || '').split("?")[0].split("/");
                let audio_file_name = audio_url_split[audio_url_split.length - 1];

                let audio_url_current = soundUrl || "";
                let audio_url_split_current = audio_url_current.split("?")[0].split("/");
                let audio_file_name_current = audio_url_split_current[audio_url_split_current.length - 1];

                return (
                  <View key={urlL}>
                    {item.isAudio ? (
                      <View style={{ flexDirection: 'column' }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}
                        >
                          <IconButton icon={!soundOnPause && audio_file_name_current == audio_file_name ? "pause" : "play"} iconColor={colors.primary} size={24} onPress={
                            () => audio_file_name_current == audio_file_name ? (soundOnPause ? playASoundOnCurrentPause() : pauseASound()) : playASound(audio_url)
                          } />
                          <View style={styles_audio.container}>
                            <Animated.View style={[styles_audio.bar, { width: audio_file_name_current == audio_file_name ? getProgress() : 0 }]} />
                          </View>
                          {/* <Text
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
                          </Text> */}
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
                          >{parseInt(String(audio_file_name_current == audio_file_name && position ? position / 1000 : 0))}{item?.duration_f ? `/${item?.duration_f}` : ''}</Text>
                        </View>

                      </View>
                    ) : (
                      <View style={{ flex: 1, flexDirection: 'row' }}>
                        <ImageBackground
                          key={`${item.id} ${urlL}`}
                          source={(urlL && urlL.includes('.pdf')) ? require('../../../../../assets/pdf.png') : { uri: urlL }}
                          style={{
                            height: 80,
                            width: 80,
                            marginHorizontal: 1,
                            alignSelf: 'flex-start',
                            justifyContent: 'flex-end',
                            marginVertical: 20,
                          }}
                        >

                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                            <TouchableOpacity
                              onPress={() => openAttachmentViewer(item)}
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
                            {!item.local_url && item.url && (
                              <TouchableOpacity
                                onPress={() => handleDownloadAttachment(item)}
                                disabled={downloadingIds.has(item.id)}
                                style={{
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                                  marginLeft: 2,
                                }}
                              >
                                <MaterialCommunityIcons
                                  name={downloadingIds.has(item.id) ? 'progress-download' : 'download'}
                                  size={16}
                                  color={colors.primary}
                                />
                              </TouchableOpacity>
                            )}
                          </View>

                        </ImageBackground>
                      </View>
                    )}
                  </View>
                )
              }
              )
            }
            {isSyncing && <View>
              <ProgressBarAndroid styleAttr="Horizontal" color="primary.500" key={"task_progress_key"} />
            </View>}
          </View>
        </View>
        <CustomSeparator />
        <TouchableOpacity
          onPress={() => setIsDescriptionCollapsed(!isDescriptionCollapsed)}
          style={styles.collapsibleTrigger}
        >
          <Text style={styles.subtitle}>{t('description_label')}</Text>
          <MaterialCommunityIcons
            name={isDescriptionCollapsed ? 'chevron-down-circle' : 'chevron-up-circle'}
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
        <Collapsible collapsed={isDescriptionCollapsed}>
          <View style={styles.collapsibleContent}>
            <Text
              style={{
                fontFamily: 'Poppins_400Regular',
                fontSize: 12,
                fontWeight: 'normal',
                fontStyle: 'normal',
                lineHeight: 15,
                letterSpacing: 0,
                textAlign: 'left',
                color: '#707070',
              }}
            >
              {issue.description}
            </Text>
          </View>
        </Collapsible>

        {issue.research_result && (<>
          <CustomSeparator />
          <TouchableOpacity
            onPress={() => setIsResolveDescritionCollapsed(!isResolveDescritionCollapsed)}
            style={styles.collapsibleTrigger}
          >
            <Text style={styles.subtitle}>{t('resolve_description_label')}</Text>
            <MaterialCommunityIcons
              name={isResolveDescritionCollapsed ? 'chevron-down-circle' : 'chevron-up-circle'}
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>
          <Collapsible collapsed={isResolveDescritionCollapsed}>
            <View style={styles.collapsibleContent}>
              <Text
              >
                {issue.research_result}
              </Text>

              {resolutionFiles && resolutionFiles.length > 0 ? <View style={{
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <ImageBackground
                  key={resolutionFiles[0].id}
                  source={require('../../../../../assets/pdf.png')}
                  style={{
                    height: 200,
                    width: 200,
                    marginHorizontal: 1,
                    alignSelf: 'center',
                    justifyContent: 'flex-end',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <TouchableOpacity
                      onPress={() => openAttachmentViewer(resolutionFiles[0])}
                      style={{
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.5)',
                      }}
                    >
                      <Image
                        resizeMode="stretch"
                        style={{ width: 75, height: 75, borderRadius: 50, marginBottom: 5 }}
                        source={require('../../../../../assets/eye.png')}
                      />
                    </TouchableOpacity>
                    {!resolutionFiles[0].local_url && resolutionFiles[0].url && (
                      <IconButton
                        icon={downloadingIds.has(resolutionFiles[0].id) ? 'progress-download' : 'download'}
                        iconColor={colors.primary}
                        size={24}
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
                        disabled={downloadingIds.has(resolutionFiles[0].id)}
                        onPress={() => handleDownloadAttachment(resolutionFiles[0])}
                      />
                    )}
                  </View>
                </ImageBackground>
              </View> : <View></View>}
            </View>
          </Collapsible>
        </>)}
        <CustomSeparator />
        <TouchableOpacity
          style={styles.collapsibleTrigger}
        >
          <Text style={styles.subtitle}>{t('decisions')}/{t('investigations')}</Text>
          <MaterialCommunityIcons
            name={'chevron-down-circle'}
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
        <View style={styles.collapsibleContent}>
          {issue.research_result ? <Text>{issue.research_result}</Text> : <></>}
          <Text></Text>
          <View
            style={{
              fontFamily: 'Poppins_400Regular',
              fontSize: 12,
              fontWeight: 'normal',
              fontStyle: 'normal',
              lineHeight: 15,
              letterSpacing: 0,
              textAlign: 'left',
              color: '#707070',
            }}
          >
            {(issue.research_result || (issueReasons && issueReasons.length != 0))
              ?
              <>
                {
                  (issueReasons && issueReasons.length != 0)
                    ?
                    <>
                      <SafeAreaView style={{
                        flex: 1,
                        backgroundColor: "white",
                      }}>

                        <UpdatableList
                          horizontal
                          ItemSeparatorComponent={() => <Divider style={{
                            marginTop: 7, marginBottom: 7
                          }} />}
                          style={{ flex: 1 }}
                          data={issueReasons}
                          keyExtractor={(item) => `${item.id} ${item.local_url}` ?? `${item.due_at} ${item.local_url}`}
                          renderItem={renderItemReason}
                        />

                      </SafeAreaView>
                    </>
                    : <></>
                }
              </>
              : <Text>{t('information_not_available')}</Text>}
          </View>
        </View>

        {isSyncing && <View>
          <ProgressBarAndroid styleAttr="Horizontal" color="primary.500" key={"task_progress_key_1"} />
        </View>}

        <CustomSeparator />
        <Button
          theme={theme}
          style={{ alignSelf: 'center', margin: 24 }}
          labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
          mode="contained"
          onPress={onAddComment}
        >
          {t('back')}
        </Button>
      </View>




      <Portal>
        <Dialog visible={editLocationDialog} onDismiss={_hideEditLocationDialog}>
          <Dialog.Content>
            <Paragraph>{t('location')}</Paragraph>
            {
              (cantons == null || villages == null) ?
                <ActivityIndicator color={colors.primary} size="small" />
                :
                <>
                  {!hideCantonField && cantonsItems && (<View style={{ zIndex: 2000 }}>
                    <CustomDropDownPickerWithRender
                      schema={{
                        label: 'name',
                        value: 'id',
                      }}
                      placeholder={t('step_location_dropdown_placeholder')}
                      value={canton}
                      setValue={setCanton}
                      items={cantonsItems}
                      setPickerValue={setCanton}
                      setItems={setCantonsItems}
                      onSelectItem={(item) => {
                        setVillagesInfos(hideCantonField, item);
                        setSelectedselectedCanton(item);
                      }}
                      open={open}
                      setOpen={setOpen}
                    />
                  </View>)}

                  {!hideVillageField && villagesItems && (<View style={{ zIndex: 2000 }}>
                    <CustomDropDownPickerWithRender
                      schema={{
                        label: 'name',
                        value: 'id',
                      }}
                      placeholder={t('step_location_dropdown_placeholder')}
                      value={village}
                      setValue={setVillage}
                      items={villagesItems}
                      setPickerValue={setVillage}
                      setItems={setVillagesItems}
                      onSelectItem={(item) => setSelectedselectedVillage(item)}
                      open={openVillage}
                      setOpen={setOpenVillage}
                    />
                  </View>)}

                  {selectedVillage && (<View style={{ paddingHorizontal: 50, flexDirection: 'row', marginBottom: 15 }} >
                    <Image source={require("../../../../../assets/location_icon.png")}
                      style={{
                        resizeMode: 'contain',
                        width: 50,
                        height: 50,
                        flex: 1
                      }} />
                    <Text style={{ ...styles.stepDescription, flex: 4, marginTop: 15 }}>{selectedVillage.name}</Text>
                  </View>)}
                </>
            }


          </Dialog.Content>
          <Dialog.Actions>
            <IconButton
              icon="refresh"
              iconColor={playing ? colors.disabled : colors.primary}
              size={24}
              onPress={() => onRefresh()}
            />
            <Button
              theme={theme}
              style={{ alignSelf: 'center', backgroundColor: '#d4d4d4' }}
              labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
              mode="contained"
              onPress={_hideEditLocationDialog}
            >
              {t('cancel')}
            </Button>
            <Button
              disabled={cantons == null || villages == null}
              theme={theme}
              style={{ alignSelf: 'center', margin: 24 }}
              labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
              mode="contained"
              onPress={saveADLIssue}
            >
              {t('save_button_text')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <AttachmentViewerModal
        visible={!!viewerAttachment}
        onClose={() => setViewerAttachment(null)}
        uri={viewerAttachment?.uri}
        isPdf={viewerAttachment?.isPdf}
        title={viewerAttachment?.name}
        isLocal={viewerAttachment?.isLocal}
        onDownload={() => viewerAttachment?.item && handleDownloadAttachment(viewerAttachment.item)}
        onShare={() => viewerAttachment?.item && openAttachment(viewerAttachment.item)}
      />

    </ScrollView>
  );
}

export default Content;

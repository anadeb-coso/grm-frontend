import { MaterialCommunityIcons, AntDesign, Feather } from '@expo/vector-icons';
import { useBackHandler } from '@react-native-community/hooks';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Image, Platform, ScrollView, Text, TouchableOpacity, 
  View, FlatList, SafeAreaView, RefreshControl, Alert } from 'react-native';
import Collapsible from 'react-native-collapsible';
import { Button, IconButton, Divider, Dialog, Paragraph, Portal, ActivityIndicator } from 'react-native-paper';
import NetInfo from '@react-native-community/netinfo';
import CustomSeparator from '../../../../components/CustomSeparator/CustomSeparator';
// import { baseURL } from '../../../../services/API';
import { couchDBURLBase } from '../../../../utils/databaseManager';
import { colors } from '../../../../utils/colors';
import { LocalGRMDatabase } from '../../../../utils/databaseManager';
import { getEncryptedData } from '../../../../utils/storageManager';
import { citizenTypes } from '../../../../utils/utils';
import { styles } from './Content.styles';
import API from '../../../../services/API';
import CustomDropDownPickerWithRender from '../../../../components/CustomDropDownPicker/CustomDropDownPicker';
import { setCommune, setDocument } from '../../../../store/ducks/userDocument.duck';
import UpdatableList from "../../../../components/UpdatableList";

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
  const [dbConfig, setDbConfig] = useState({});

  const [comments, setComments] = useState(issue.comments);
  const [isIssueAssignedToMe, setIsIssueAssignedToMe] = useState(false);
  const [currentDate, setCurrentDate] = useState(moment());
  const [newComment, setNewComment] = useState();
  const [isDescriptionCollapsed, setIsDescriptionCollapsed] = useState(true);
  const [isDecisionCollapsed, setIsDecisionCollapsed] = useState(true);
  const [isSatisfactionCollapsed, setIsSatisfactionCollapsed] = useState(true);
  const [isAppealCollapsed, setIsAppealCollapsed] = useState(true);
  const [_sound, setSound] = useState();
  const [imageError, setImageError] = useState(false);

  const [playing, setPlaying] = useState(false);
  
  const [editLocationDialog, setEditLocationDialog] = useState(false);
  const _showEditLocationDialog = () => setEditLocationDialog(true);
  const _hideEditLocationDialog = () => setEditLocationDialog(false);

  const scrollViewRef = useRef();

  //Adminstrative
  const dispatch = useDispatch();
  const { username, userPassword } = useSelector((state) => state.get('authentication').toObject());
  const { userCommune } = useSelector((state) => state.get('userDocument').toObject());

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

  const setVillagesInfos = (hideC, c) => {
    let v = [];
    if((villages && [0, 1].includes(villages.length)) || (hideC == false && c == null)){
      setHideVillageField(true);
      if(villages && villages.length == 1){
        setVillage(villages[0]);
        setSelectedselectedVillage(villages[0]);
      }
    }else{
      if(villages){
        for(let i=0; i<villages.length; i++){
          if(c != null && c.id == villages[i].parent){
            v.push({name: String(villages[i].name), id: String(villages[i].id)});
          }else if(c  == null){
            v.push({name: String(villages[i].name), id: String(villages[i].id)});
          }
          if(i+1==villages.length){
            setVillagesItems(v);
          }
        }
      }
      setHideVillageField(false);
    }
  }

  const getAdministrativeLevels = () => {
    setCantons(null);
    setVillages(null);
    new API().administrativeLevelsFilterByAdministrativeRegion(userCommune.administrative_id, {}).then((response) => {
      if (response.error) {
        console.log(response.error);
        Alert.alert('Warning', response?.error?.toString(), [{ text: 'OK' }], {
          cancelable: false,
        });
        return;
      }
      setCantons(response.cantons);
      setVillages(response.villages);
      
      let d = [];
      if(cantons && villages && cantons.length == 0 && villages.length == 0){
        setHideCantonField(true);
        setHideVillageField(true);
      }else if(cantons && [0, 1].includes(cantons.length)){
        setHideCantonField(true);
        setVillagesInfos(true, canton);
      }else{
        setHideCantonField(false);
        setVillagesInfos(false, canton);
        if(cantons){
          for(let i=0; i<cantons.length; i++){
            d.push({name: String(cantons[i].name), id: String(cantons[i].id)});
            if(i+1==cantons.length){
              setCantonsItems(d);
            }
          }
        }
      }
    }).catch((error) => {
      console.log("7777777777777777777777777777");
      console.log(error);
    });

    NetInfo.fetch().then((state) => {
      if(!state.isConnected){
        lert.alert('Not intervent', '', [{ text: 'OK' }], {
          cancelable: false,
        });
      }
  });

  };



  useEffect(() => {
    const fetchUserCommune = async () => {

      setDbConfig(await getEncryptedData(
        `dbCredentials_${userPassword}_${username.replace('@', '')}`
      ));

      if (!userCommune) {
        console.log(username)
        const { userDoc, userCommune: usrC } = await getUserDocs(username);
        if (userDoc) {
          dispatch(setDocument(userDoc)); // Dispatch setDocument action
        }
        if (usrC) {
          dispatch(setCommune(usrC)); // Dispatch setCommune action
        }
      }
    };
    fetchUserCommune(); // Call the fetch userCommune data function
  }, [dispatch, userCommune, username]);


  useEffect(() => {
    getAdministrativeLevels();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    getAdministrativeLevels();
    setRefreshing(false);
  };

  const saveADLIssue = () => {
    let issueLocation = {
      administrative_id: selectedVillage?.id,
      name: selectedVillage?.name,
    };
    issue.location_info = {
      ...issue.location_info,
      issue_location: issueLocation
    };
    issue.administrative_region = issueLocation;
    LocalGRMDatabase.upsert(issue._id, (doc) => {
      doc = issue;
      return doc;
    })
      .then(() => {
        _hideEditLocationDialog();
        onRefresh();
      })
      .catch((err) => {
        console.log('Error', err);
      });
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

  useEffect(() => {
    function _isIssueAssignedToMe() {
      if (issue.assignee && issue.assignee.id) {
        return issue.reporter.id === issue.assignee.id;
      }
    }

    setIsIssueAssignedToMe(_isIssueAssignedToMe());
  }, []);

  const upsertNewComment = () => {
    LocalGRMDatabase.upsert(issue._id, (doc) => {
      doc = issue;
      return doc;
    });
  };
  React.useEffect(
    () =>
      _sound
        ? () => {
            // console.log("Unloading Sound");
            _sound.unloadAsync();
          }
        : undefined,
    [_sound]
  );

  const playSound = async (recordingUri, remoteUrl) => {
    if (playing === false) {
      setPlaying(true);
      try {
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
      } catch (e) {
        console.log(e);
        try {
          const { sound } = await Audio.Sound.createAsync({ uri: `${couchDBURLBase}${remoteUrl}` });
          setSound(sound);
          // console.log("Playing Sound");
          await sound.playAsync();

          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.didJustFinish) {
              setPlaying(false);
            }
          });
        } catch (_e) {
          console.log(_e);
        }
      }
    }
    // setPlaying(false)
  };

  const onAddComment = () => {
    if (newComment) {
      const commentDate = moment().format('DD-MMM-YYYY');
      let cs = issue.comments.unshift({
        name: issue.reporter.name,
        comment: newComment,
        due_at: commentDate,
      });
      // issue.comments = [
      //   ...issue.comments,
      //   {
      //     name: issue.reporter.name,
      //     comment: newComment,
      //     due_at: commentDate,
      //   },
      // ];
      // setComments([
      //   ...comments,
      //   {
      //     name: issue.reporter.name,
      //     comment: newComment,
      //     due_at: commentDate,
      //   },
      // ]);
      issue.comments = cs;
      setComments(issue.comments);
      
      setNewComment('');
      setTimeout(() => {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }, 50);
    }
    upsertNewComment();
  };

  const renderItemReason = ({ item, index }) => {
    if(item.type == "comment"){
      return (
        <View key={index} style={{...styles.commentCard, width: 200, height: 200}}>
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
    }else{
      return(
        <View key={index} style={{...styles.commentCard, width: 150, height: 200}}>
          {(item.url.includes(".3gp") || item.local_url.includes(".3gp")) ? (
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
                onPress={() => playSound(item.local_url, item.url)}
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
            </View>
          ) : (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              // justifyContent: 'center',
            }}>
              {/* <Image
                  source={{ uri: `${couchDBURLBase}${item.url}`, headers:{
                    username: dbConfig?.username, // CouchDB username
                    password: dbConfig?.password, // CouchDB password
                  } }}
                  onError={() => setImageError(true)}
                  style={{
                    height: 80,
                    width: 80,
                    justifyContent: 'flex-end',
                    marginVertical: 20,
                    marginLeft: 20,
                  }}
                /> */}
              {imageError ? (
                <Image
                  key={`${couchDBURLBase}${item.url}`}
                  source={{ uri: `${couchDBURLBase}${item.url}`, headers:{
                    username: dbConfig?.username, // CouchDB username
                    password: dbConfig?.password, // CouchDB password
                  } }}
                  onError={() => setImageError(true)}
                  style={{
                    height: 80,
                    width: 80,
                    justifyContent: 'flex-end',
                    marginVertical: 20,
                    marginLeft: 20,
                  }}
                />
              ) : (
                <Image
                  key={item.local_url}
                  source={{ uri: item.local_url }}
                  onError={() => setImageError(true)}
                  style={{
                    height: 80,
                    width: 80,
                    justifyContent: 'flex-end',
                    marginVertical: 20,
                    marginLeft: 20,
                  }}
                />
              )}
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
              {/* {t('location')}{' '} */}
              {/* <Text style={styles.text}>
                {' '}
                {issue.citizen_type === 1 && !isIssueAssignedToMe
                  ? t('confidential')
                  : issue.administrative_region?.name ?? t('information_not_available')}
              </Text> */}
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
            {issue.attachments?.length > 0 &&
              issue.attachments.map((item, index) => (
                <View>
                  {item.isAudio ? (
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
                        onPress={() => playSound(item.local_url, item.url)}
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
                    </View>
                  ) : (
                    <View>
                      {imageError ? (
                        <Image
                          source={{ uri: item.url }}
                          onError={() => setImageError(true)}
                          style={{
                            height: 80,
                            width: 80,
                            justifyContent: 'flex-end',
                            marginVertical: 20,
                            marginLeft: 20,
                          }}
                        />
                      ) : (
                        <Image
                          source={{ uri: item.local_url }}
                          onError={() => setImageError(true)}
                          style={{
                            height: 80,
                            width: 80,
                            justifyContent: 'flex-end',
                            marginVertical: 20,
                            marginLeft: 20,
                          }}
                        />
                      )}
                    </View>
                  )}
                </View>
              ))}
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
        <CustomSeparator />
        <TouchableOpacity
          onPress={() => setIsDecisionCollapsed(!isDecisionCollapsed)}
          style={styles.collapsibleTrigger}
        >
          <Text style={styles.subtitle}>{t('decision')}</Text>
          <MaterialCommunityIcons
            name={isDecisionCollapsed ? 'chevron-down-circle' : 'chevron-up-circle'}
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
        <Collapsible collapsed={isDecisionCollapsed}>
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
              {/* {issue.research_result ?? t('information_not_available')} */}
              {(issue.research_result || (issue.reasons && issue.reasons.length != 0)) 
              ? 
                <>
                  {
                    (issue.reasons && issue.reasons.length != 0) 
                    ?
                      <>
                        {/* {issue.research_result ? <Text>{t('other')}</Text> : <></>} */}
                        <SafeAreaView style={{
                            flex: 1,
                            backgroundColor: "white",
                          }}>
                              {/* <FlatList
                              horizontal
                                ItemSeparatorComponent={() => <Divider style={{
                                  marginTop: 7, marginBottom: 7
                                }} />}
                                style={{ flex: 1 }}
                                data={issue.reasons}
                                renderItem={renderItemReason}
                                keyExtractor={(item) => `${item.id} ${item.local_url}` ?? `${item.due_at} ${item.local_url}`}
                              /> */}

                            <UpdatableList
                                  // onFetchMoreData={handleFetchMoreData}
                                  horizontal
                                  ItemSeparatorComponent={() => <Divider style={{
                                    marginTop: 7, marginBottom: 7
                                  }} />}
                                  style={{ flex: 1 }}
                                  data={issue.reasons}
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
        </Collapsible>
        {/* <CustomSeparator />
        <TouchableOpacity
          onPress={() => setIsSatisfactionCollapsed(!isSatisfactionCollapsed)}
          style={styles.collapsibleTrigger}
        >
          <Text style={styles.subtitle}>{t('satisfaction')}</Text>
          <MaterialCommunityIcons
            name={isSatisfactionCollapsed ? 'chevron-down-circle' : 'chevron-up-circle'}
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
        <Collapsible collapsed={isSatisfactionCollapsed}>
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
              {t('information_not_available')}
            </Text>
          </View>
        </Collapsible> */}
        {/* <CustomSeparator />
        <TouchableOpacity
          onPress={() => setIsAppealCollapsed(!isAppealCollapsed)}
          style={styles.collapsibleTrigger}
        >
          <Text style={styles.subtitle}>{t('appeal_reason')}</Text>
          <MaterialCommunityIcons
            name={isAppealCollapsed ? 'chevron-down-circle' : 'chevron-up-circle'}
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
        <Collapsible collapsed={isAppealCollapsed}>
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
              {t('information_not_available')}
            </Text>
          </View>
        </Collapsible> */}
        {/* <CustomSeparator /> */}
        {/* <Text style={styles.title}>{t("attachments_label")}</Text> */}
        {/* {issue?.attachments.map((item) => ( */}
        {/*  <Text style={[styles.text, { marginBottom: 10 }]}>{item.uri}</Text> */}
        {/* ))} */}
        {/* <CustomSeparator /> */}
        {/* <Text style={styles.title}>Activity</Text> */}
        {/* {comments?.map((item) => ( */}
        {/*  <View style={{ flex: 1 }}> */}
        {/*    <View style={{ flexDirection: "row", marginVertical: 10, flex: 1 }}> */}
        {/*      <View */}
        {/*        style={{ */}
        {/*          width: 32, */}
        {/*          height: 32, */}
        {/*          backgroundColor: "#f5ba74", */}
        {/*          borderRadius: 16, */}
        {/*        }} */}
        {/*      /> */}
        {/*      <View style={{ marginLeft: 10 }}> */}
        {/*        <Text style={styles.text}>{item.name}</Text> */}
        {/*        <Text style={styles.text}> */}
        {/*          {moment(item.due_at).format("DD-MMM-YYYY")} */}
        {/*        </Text> */}
        {/*      </View> */}
        {/*    </View> */}
        {/*    <Text style={styles.text}>{item.comment}</Text> */}
        {/*  </View> */}
        {/* ))} */}

        {/* <TextInput */}
        {/*  multiline */}
        {/*  numberOfLines={4} */}
        {/*  style={[styles.grmInput, { height: 80 }]} */}
        {/*  placeholder={t("comment_placeholder")} */}
        {/*  outlineColor={"#f6f6f6"} */}
        {/*  theme={theme} */}
        {/*  mode={"outlined"} */}
        {/*  value={newComment} */}
        {/*  onChangeText={(text) => setNewComment(text)} */}
        {/* /> */}

        {/* <Button */}
        {/*  theme={theme} */}
        {/*  style={{ alignSelf: "center", margin: 24 }} */}
        {/*  labelStyle={{ color: "white", fontFamily: "Poppins_500Medium" }} */}
        {/*  mode="contained" */}
        {/*  onPress={onAddComment} */}
        {/* > */}
        {/*  Add comment */}
        {/* </Button> */}
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
                  </View> )}

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
                  </View> )}

                  {selectedVillage && (<View style={{ paddingHorizontal: 50, flexDirection: 'row', marginBottom: 15 }} >
                    <Image source={require("../../../../../assets/location_icon.png")} 
                    style={{
                      resizeMode: 'contain',
                      width: 50,
                      height: 50,
                      flex: 1
                    }}/>
                    <Text style={{...styles.stepDescription, flex: 4, marginTop: 15}}>{selectedVillage.name}</Text>
                  </View> )}
                </>
              }
              
            
          </Dialog.Content>
            <Dialog.Actions>
            <IconButton
                icon="refresh"
                color={playing ? colors.disabled : colors.primary}
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



    </ScrollView>
  );
}

export default Content;

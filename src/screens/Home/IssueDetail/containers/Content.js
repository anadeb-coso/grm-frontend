import React, { useEffect, useState, useRef } from "react";
import { View, ScrollView, Text, Platform, TouchableOpacity, Image } from 'react-native';
import * as ImagePicker from "expo-image-picker";
import moment from "moment";
import { useBackHandler } from "@react-native-community/hooks";
import i18n from "i18n-js";
import { Button, IconButton } from 'react-native-paper';
import Collapsible from 'react-native-collapsible';
import {MaterialCommunityIcons} from "@expo/vector-icons";
import { LocalGRMDatabase } from "../../../../utils/databaseManager";
import {citizenTypes} from "../../../../utils/utils";
import CustomSeparator from "../../../../components/CustomSeparator/CustomSeparator";
import { colors } from "../../../../utils/colors";
import { styles } from "./Content.styles";
import { Audio } from 'expo-av';
import { baseURL } from '../../../../services/API';


const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: "white",
    placeholder: "#dedede",
    text: "#707070",
  },
};

function Content({ issue }) {
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

  const scrollViewRef = useRef();

  useBackHandler(() =>
    // navigation.navigate("GRM")
    // handle it
     true
  );

  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          alert("Sorry, we need camera roll permissions to make this work!");
        }
      }
    })();
  }, []);

  useEffect(() =>{
      function _isIssueAssignedToMe() {
          if(issue.assignee && issue.assignee.id) {
              return issue.reporter.id === issue.assignee.id
          }
      }

      setIsIssueAssignedToMe(_isIssueAssignedToMe())
  }, [])

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
      if(playing === false) {
        setPlaying(true)
        try{
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

        } catch (e) {
          console.log(e)
          try {
            const { sound } = await Audio.Sound.createAsync({ uri: `${baseURL}${remoteUrl}` });
            setSound(sound);
            // console.log("Playing Sound");
            await sound.playAsync();

            sound.setOnPlaybackStatusUpdate((status) => {
              if(status.didJustFinish) {
                setPlaying(false)
              }
            })
          } catch (_e) {
            console.log(_e)
          }
        }
      }
    // setPlaying(false)
  };


  const onAddComment = () => {
    if (newComment) {
      const commentDate = moment().format("DD-MMM-YYYY");
      issue.comments = [
        ...issue.comments,
        {
          name: issue.reporter.name,
          comment: newComment,
          due_at: commentDate,
        },
      ];
      setComments([
        ...comments,
        {
          name: issue.reporter.name,
          comment: newComment,
          due_at: commentDate,
        },
      ]);
      setNewComment("");
      setTimeout(() => {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }, 50);
    }
    upsertNewComment();
  };


  return (
    <ScrollView
      ref={scrollViewRef}
      contentContainerStyle={{ alignItems: "center", padding: 20 }}
    >


      <View
        style={styles.infoContainer}
      >
          <View
              style={{flexDirection: 'row'}}
          >
              <View style={{ marginBottom: 10, justifyContent: 'flex-end', flex: 1, flexDirection:'row' }}>
                  <Text style={[styles.text, {fontSize: 12, color: colors.primary}]}>
                      {" "}
                      {issue.issue_date &&
                      moment(issue.issue_date).format("DD-MMM-YYYY")}   {issue.issue_date &&
                  currentDate.diff(issue.issue_date, "days")} {i18n.t('days_ago')}
                  </Text>
              </View>
          </View>
          <View
              style={{
                  flexDirection: "row",
                  flex: 1,
                  justifyContent: "space-between",
                  marginTop: 10,
              }}
          >
              <View style={{ flex: 1 }}>

                  <Text style={styles.subtitle}>
                      {i18n.t('lodged_by')}
                      <Text style={styles.text}> {citizenTypes[issue.citizen_type] ?? i18n.t('information_not_available')}</Text>
                  </Text>
                  <Text style={styles.subtitle}>
                      {i18n.t('name')}
                      <Text style={styles.text}> {issue.citizen_type === 1 && !isIssueAssignedToMe ? i18n.t('confidential') : issue.citizen}</Text>
                  </Text>
                  <Text style={styles.subtitle}>
                      {i18n.t('age')}{" "}
                      <Text style={styles.text}> {issue.citizen_type === 1 && !isIssueAssignedToMe ? i18n.t('confidential') : issue.citizen_age_group?.name ?? i18n.t('information_not_available')}</Text>
                  </Text>

                  <Text style={styles.subtitle}>
                      {i18n.t('location')}{" "}
                      <Text style={styles.text}> {issue.citizen_type === 1 && !isIssueAssignedToMe ? i18n.t('confidential') : issue.administrative_region?.name ?? i18n.t('information_not_available')}</Text>
                  </Text>
                  <Text style={styles.subtitle}>
                      {i18n.t('category')}{" "}
                      <Text style={styles.text}> {issue.category?.name ?? i18n.t('information_not_available')}</Text>
                  </Text>
                  <Text style={styles.subtitle}>
                      {i18n.t('assigned_to')}{" "}
                      <Text style={styles.text}> {issue.assignee?.name ?? "Pending Assigment"}</Text>
                  </Text>
                {issue.attachments?.length > 0 && issue.attachments.map((item, index) => (<View>

                    {item.isAudio ? <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        // justifyContent: 'center',
                      }}
                    >
                      <IconButton icon="play" color={playing ? colors.disabled : colors.primary} size={24} onPress={() => playSound(item.local_url, item.url)} />
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
                    </View>
                      :
                      <View>
                        {imageError ?
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
                          :
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
                          />}
                      </View>
                    }
                   </View>
                  ))}

              </View>
          </View>
          <CustomSeparator/>
        <TouchableOpacity onPress={() => setIsDescriptionCollapsed(!isDescriptionCollapsed)}
          style={styles.collapsibleTrigger}
        >
          <Text style={styles.subtitle}>{i18n.t("description_label")}</Text>
            <MaterialCommunityIcons
                name={isDescriptionCollapsed ? "chevron-down-circle" : "chevron-up-circle"}
                size={24}
                color={colors.primary}
            />
        </TouchableOpacity>
          <Collapsible collapsed={isDescriptionCollapsed}>

        <View
          style={styles.collapsibleContent}
        >
          <Text
            style={{
              fontFamily: "Poppins_400Regular",
              fontSize: 12,
              fontWeight: "normal",
              fontStyle: "normal",
              lineHeight: 15,
              letterSpacing: 0,
              textAlign: "left",
              color: "#707070",
            }}
          >
            {issue.description}
          </Text>
        </View>
          </Collapsible>
          <CustomSeparator />
          <TouchableOpacity onPress={() => setIsDecisionCollapsed(!isDecisionCollapsed)}
                            style={styles.collapsibleTrigger}
          >
              <Text style={styles.subtitle}>{i18n.t('decision')}</Text>
              <MaterialCommunityIcons
                  name={isDecisionCollapsed ? "chevron-down-circle" : "chevron-up-circle"}
                  size={24}
                  color={colors.primary}
              />
          </TouchableOpacity>
          <Collapsible collapsed={isDecisionCollapsed}>

              <View
                  style={styles.collapsibleContent}
              >
                  <Text
                      style={{
                          fontFamily: "Poppins_400Regular",
                          fontSize: 12,
                          fontWeight: "normal",
                          fontStyle: "normal",
                          lineHeight: 15,
                          letterSpacing: 0,
                          textAlign: "left",
                          color: "#707070",
                      }}
                  >
                      {issue.research_result ?? i18n.t('information_not_available')}
                  </Text>
              </View>
          </Collapsible>
          <CustomSeparator />
          <TouchableOpacity onPress={() => setIsSatisfactionCollapsed(!isSatisfactionCollapsed)}
                            style={styles.collapsibleTrigger}
          >
              <Text style={styles.subtitle}>{i18n.t('satisfaction')}</Text>
              <MaterialCommunityIcons
                  name={isSatisfactionCollapsed ? "chevron-down-circle" : "chevron-up-circle"}
                  size={24}
                  color={colors.primary}
              />
          </TouchableOpacity>
          <Collapsible collapsed={isSatisfactionCollapsed}>

              <View
                  style={styles.collapsibleContent}
              >
                  <Text
                      style={{
                          fontFamily: "Poppins_400Regular",
                          fontSize: 12,
                          fontWeight: "normal",
                          fontStyle: "normal",
                          lineHeight: 15,
                          letterSpacing: 0,
                          textAlign: "left",
                          color: "#707070",
                      }}
                  >
                      {i18n.t('information_not_available')}
                  </Text>
              </View>
          </Collapsible>
          <CustomSeparator />
          <TouchableOpacity onPress={() => setIsAppealCollapsed(!isAppealCollapsed)}
                            style={styles.collapsibleTrigger}
          >
              <Text style={styles.subtitle}>{i18n.t('appeal_reason')}</Text>
              <MaterialCommunityIcons
                  name={isAppealCollapsed ? "chevron-down-circle" : "chevron-up-circle"}
                  size={24}
                  color={colors.primary}
              />
          </TouchableOpacity>
          <Collapsible collapsed={isAppealCollapsed}>

              <View
                  style={styles.collapsibleContent}
              >
                  <Text
                      style={{
                          fontFamily: "Poppins_400Regular",
                          fontSize: 12,
                          fontWeight: "normal",
                          fontStyle: "normal",
                          lineHeight: 15,
                          letterSpacing: 0,
                          textAlign: "left",
                          color: "#707070",
                      }}
                  >
                      {i18n.t('information_not_available')}
                  </Text>
              </View>
          </Collapsible>
        {/* <CustomSeparator /> */}
        {/* <Text style={styles.title}>{i18n.t("attachments_label")}</Text> */}
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
        {/*  placeholder={i18n.t("comment_placeholder")} */}
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
        <CustomSeparator/>
          <Button
            theme={theme}
            style={{ alignSelf: "center", margin: 24 }}
            labelStyle={{ color: "white", fontFamily: "Poppins_500Medium" }}
            mode="contained"
            onPress={onAddComment}
          >
            {i18n.t('back')}
          </Button>
      </View>
    </ScrollView>
  );
}

export default Content;

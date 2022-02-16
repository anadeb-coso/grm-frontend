import React, { useEffect, useState, useRef } from "react";
import { View, ScrollView, Text, Platform, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { styles } from "./Content.styles";
import * as ImagePicker from "expo-image-picker";
import moment from "moment";
import { colors } from "../../../../utils/colors";
import { useBackHandler } from "@react-native-community/hooks";
import CustomSeparator from "../../../../components/CustomSeparator/CustomSeparator";
import CustomGreenButton from "../../../../components/CustomGreenButton/CustomGreenButton";
import i18n from "i18n-js";
import { Button, TextInput } from "react-native-paper";
import { LocalGRMDatabase } from "../../../../utils/databaseManager";
import {citizenTypes} from "../../../../utils/utils";
import Collapsible from 'react-native-collapsible';
import {MaterialCommunityIcons} from "@expo/vector-icons";


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
  const scrollViewRef = useRef();

  useBackHandler(() => {
    // navigation.navigate("GRM")
    // handle it
    return true;
  });

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
                  currentDate.diff(issue.issue_date, "days")} {"days ago"}
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
                      Lodged by:
                      <Text style={styles.text}> {citizenTypes[issue.citizen_type] ?? 'No information available'}</Text>
                  </Text>
                  <Text style={styles.subtitle}>
                      Name:
                      <Text style={styles.text}> {issue.citizen_type == 1 && !isIssueAssignedToMe ? "Confidential" : issue.citizen}</Text>
                  </Text>
                  <Text style={styles.subtitle}>
                      Age:{" "}
                      <Text style={styles.text}> {issue.citizen_type == 1 && !isIssueAssignedToMe ? 'Confidential' : issue.citizen_age_group?.name ?? "Information not available"}</Text>
                  </Text>

                  <Text style={styles.subtitle}>
                      Location:{" "}
                      <Text style={styles.text}> {issue.citizen_type == 1 && !isIssueAssignedToMe ? 'Confidential' : issue.administrative_region?.name ?? "Information not available"}</Text>
                  </Text>
                  <Text style={styles.subtitle}>
                      Category:{" "}
                      <Text style={styles.text}> {issue.category?.name ?? "Information not available"}</Text>
                  </Text>
                  <Text style={styles.subtitle}>
                      Assigned to:{" "}
                      <Text style={styles.text}> {issue.assignee?.name ?? "Pending Assigment"}</Text>
                  </Text>
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
              <Text style={styles.subtitle}>Decision</Text>
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
                      {" Information not available "}
                  </Text>
              </View>
          </Collapsible>
          <CustomSeparator />
          <TouchableOpacity onPress={() => setIsSatisfactionCollapsed(!isSatisfactionCollapsed)}
                            style={styles.collapsibleTrigger}
          >
              <Text style={styles.subtitle}>Satisfaction</Text>
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
                      {" Information not available "}
                  </Text>
              </View>
          </Collapsible>
          <CustomSeparator />
          <TouchableOpacity onPress={() => setIsAppealCollapsed(!isAppealCollapsed)}
                            style={styles.collapsibleTrigger}
          >
              <Text style={styles.subtitle}>Appeal Reason</Text>
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
                      {" Information not available "}
                  </Text>
              </View>
          </Collapsible>
        {/*<CustomSeparator />*/}
        {/*<Text style={styles.title}>{i18n.t("attachments_label")}</Text>*/}
        {/*{issue?.attachments.map((item) => (*/}
        {/*  <Text style={[styles.text, { marginBottom: 10 }]}>{item.uri}</Text>*/}
        {/*))}*/}
        {/*<CustomSeparator />*/}
        {/*<Text style={styles.title}>Activity</Text>*/}
        {/*{comments?.map((item) => (*/}
        {/*  <View style={{ flex: 1 }}>*/}
        {/*    <View style={{ flexDirection: "row", marginVertical: 10, flex: 1 }}>*/}
        {/*      <View*/}
        {/*        style={{*/}
        {/*          width: 32,*/}
        {/*          height: 32,*/}
        {/*          backgroundColor: "#f5ba74",*/}
        {/*          borderRadius: 16,*/}
        {/*        }}*/}
        {/*      />*/}
        {/*      <View style={{ marginLeft: 10 }}>*/}
        {/*        <Text style={styles.text}>{item.name}</Text>*/}
        {/*        <Text style={styles.text}>*/}
        {/*          {moment(item.due_at).format("DD-MMM-YYYY")}*/}
        {/*        </Text>*/}
        {/*      </View>*/}
        {/*    </View>*/}
        {/*    <Text style={styles.text}>{item.comment}</Text>*/}
        {/*  </View>*/}
        {/*))}*/}

        {/*<TextInput*/}
        {/*  multiline*/}
        {/*  numberOfLines={4}*/}
        {/*  style={[styles.grmInput, { height: 80 }]}*/}
        {/*  placeholder={i18n.t("comment_placeholder")}*/}
        {/*  outlineColor={"#f6f6f6"}*/}
        {/*  theme={theme}*/}
        {/*  mode={"outlined"}*/}
        {/*  value={newComment}*/}
        {/*  onChangeText={(text) => setNewComment(text)}*/}
        {/*/>*/}

        {/*<Button*/}
        {/*  theme={theme}*/}
        {/*  style={{ alignSelf: "center", margin: 24 }}*/}
        {/*  labelStyle={{ color: "white", fontFamily: "Poppins_500Medium" }}*/}
        {/*  mode="contained"*/}
        {/*  onPress={onAddComment}*/}
        {/*>*/}
        {/*  Add comment*/}
        {/*</Button>*/}
        <CustomSeparator/>
          <Button
            theme={theme}
            style={{ alignSelf: "center", margin: 24 }}
            labelStyle={{ color: "white", fontFamily: "Poppins_500Medium" }}
            mode="contained"
            onPress={onAddComment}
          >
            Back
          </Button>
      </View>
    </ScrollView>
  );
}

export default Content;

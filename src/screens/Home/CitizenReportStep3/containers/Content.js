import React, { useEffect } from "react";
import { View, ScrollView, Text, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { styles } from "./Content.styles";
import { Button } from "react-native-paper";
import { colors } from "../../../../utils/colors";
import * as ImagePicker from "expo-image-picker";
import moment from "moment";
import { LocalGRMDatabase } from "../../../../utils/databaseManager";
import i18n from "i18n-js";

const SAMPLE_WORDS = ["Tree", "Cat", "Dog", "Car", "House"];
const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: "white",
    placeholder: "#dedede",
    text: "#707070",
  },
};

function Content({ issue, eadl }) {
  const navigation = useNavigation();
  const incrementId = () => {
    const last = eadl.bp_projects[eadl.bp_projects.length - 1];
    if (!eadl.bp_projects[0]) return 1;
    else return parseInt(last.id.split("-")[1]) + 1;
  };
  const randomWord = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const submitIssue = () => {
    //submit params
    const randomCodeNumber = Math.floor(Math.random() * 1000);
    // const newId = incrementId();
    const _issue = {
      internal_code: "",
      tracking_code: `${randomWord(SAMPLE_WORDS)}${randomCodeNumber}`,
      auto_increment_id: "",
      title: issue.issueSummary,
      description: issue.additionalDetails,
      attachments: [issue?.attachment, issue?.recording],
      status: {
        name: "Open",
        id: 1,
      },
      confirmed: true,
      assignee: "",
      reporter: {
        id: eadl.representative.id,
        name: eadl.representative.name,
      },
      citizen_age_group: issue.ageGroup,
      citizen: issue.name ?? "",
      contact_medium: issue.typeOfPerson,
      citizen_type: issue.citizen_type,
      citizen_group_1: issue.citizen_group_1,
      citizen_group_2: issue.citizen_group_2,
      location_info: {
        issue_location: issue.issueLocation,
        location_description: issue.locationDescription,
      } ,
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
      resolution_date: "",
      intake_date: new Date(),
      issue_date: issue.date,
      ongoing_issue: issue.ongoingEvent,
      comments: [],
      contact_information: {
        type: issue.methodOfContact,
        contact: issue.contactInfo,
      },
      commune: {
        code: eadl.commune,
        name: eadl.name,
        prefecture: "",
      },
      type: "issue",
    };
    createIssue(_issue);
    // navigation.navigate("CitizenReportStep4");
  };

  const createIssue = (_issue) => {
    LocalGRMDatabase.post(_issue)
      .then(function (response) {
        navigation.navigate("CitizenReportStep4", { issue: _issue });
      })
      .catch(function (err) {
        console.log(err);
      });
  };

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
  return (
    <ScrollView>
      <View style={{ padding: 23 }}>
        <Text style={styles.stepText}>{i18n.t("step_5")}</Text>
        <Text style={styles.stepSubtitle}>{i18n.t("step_3_confirmation")}</Text>
        <Text style={styles.stepDescription}>{i18n.t("step_3_subtitle")}</Text>
      </View>

      <View
        style={{
          margin: 23,
          padding: 18,
          borderRadius: 10,
          shadowColor: "rgba(0, 0, 0, 0.05)",
          shadowOffset: {
            width: 0,
            height: 3,
          },
          shadowRadius: 15,
          shadowOpacity: 1,

          elevation: 7,
          backgroundColor: "white",
        }}
      >
        <Text style={styles.stepSubtitle}>
          {i18n.t("step_3_field_title_1")}
        </Text>
        <Text style={styles.stepDescription}>
          {issue.date !== "null" && !!issue.date
            ? moment(issue.date).format("DD-MMMM-YYYY")
            : "--"}
        </Text>
        <Text style={styles.stepSubtitle}>
          {i18n.t("step_3_field_title_2")}
        </Text>
        <Text style={styles.stepDescription}>{issue.issueType ?? "--"}</Text>
        <Text style={styles.stepSubtitle}>
          {i18n.t("step_3_field_title_3")}
        </Text>
        <Text style={styles.stepDescription}>
          {issue.category?.name ?? "--"}
        </Text>

        <Text style={styles.stepSubtitle}>
          {i18n.t("step_3_field_title_4")}
        </Text>
        <Text style={styles.stepDescription}>
          {issue.additionalDetails ?? "--"}
        </Text>
        <Text style={styles.stepSubtitle}>{i18n.t("step_3_attachments")}</Text>
        {issue.attachment && (
          <Text style={styles.stepDescription}>
            Image: {JSON.stringify(issue?.attachment?.id) ?? "--"}
          </Text>
        )}
        {issue.recording && (
          <Text style={styles.stepDescription}>
            Audio: {JSON.stringify(issue?.recording?.id) ?? "--"}
          </Text>
        )}
      </View>
      <View style={{ paddingHorizontal: 50 }}>
        <Button
          theme={theme}
          style={{ alignSelf: "center", margin: 24 }}
          labelStyle={{ color: "white", fontFamily: "Poppins_500Medium" }}
          mode="contained"
          onPress={() => submitIssue()}
        >
          {i18n.t("submit_button_text")}
        </Button>
      </View>
    </ScrollView>
  );
}

export default Content;

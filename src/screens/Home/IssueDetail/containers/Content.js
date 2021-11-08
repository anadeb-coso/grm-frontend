import React, { useEffect, useState, useRef } from "react";
import { View, ScrollView, Text, Platform } from "react-native";
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
  const [newComment, setNewComment] = useState();
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
        style={{
          marginTop: 23,
          width: "100%",
          height: 90,
          borderRadius: 10,
          backgroundColor: "#ffffff",
          shadowColor: "rgba(0, 0, 0, 0.05)",
          shadowOffset: {
            width: 0,
            height: 3,
          },
          shadowRadius: 15,
          shadowOpacity: 1,
          padding: 17,
        }}
      >
        <Text style={styles.title}>{issue.title}</Text>
        <View style={{ marginVertical: 5 }}>
          <Text style={styles.text}>
            {i18n.t("reported_label")}:{" "}
            <Text
              style={{ color: colors.primary, fontFamily: "Poppins_700Bold" }}
            >
              {" "}
              {issue.issue_date &&
                moment(issue.issue_date).format("DD-MMM-YYYY")}
            </Text>{" "}
            <Text>/</Text>{" "}
            <Text style={{ color: "#ef6a78", fontFamily: "Poppins_700Bold" }}>
              15 days ago
            </Text>
          </Text>
        </View>
        <CustomGreenButton buttonStyle={{ height: 25, width: 100 }}>
          <Text
            style={{
              fontFamily: "Poppins_400Regular",
              fontSize: 12,
              lineHeight: 0,
            }}
          >
            {i18n.t("status_label")}:{" "}
            <Text style={{ fontFamily: "Poppins_700Bold" }}>OPEN</Text>
          </Text>
        </CustomGreenButton>
      </View>
      <CustomSeparator />
      <View
        style={{
          flex: 1,
          width: "100%",
          borderRadius: 10,
          backgroundColor: "#ffffff",
          shadowColor: "rgba(0, 0, 0, 0.05)",
          shadowOffset: {
            width: 0,
            height: 3,
          },
          shadowRadius: 15,
          shadowOpacity: 1,
          // marginHorizontal: 23,
          padding: 18,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            flex: 1,
            justifyContent: "space-between",
          }}
        >
          <Text style={styles.title}>{i18n.t("description_label")}</Text>
          {/*<TouchableOpacity>*/}
          {/*  <Feather name="edit" size={24} color={colors.primary} />*/}
          {/*</TouchableOpacity>*/}
        </View>
        <View
          style={{
            borderRadius: 10,
            padding: 14,
            marginTop: 5,
            backgroundColor: "#ffffff",
            borderStyle: "solid",
            borderWidth: 1,
            borderColor: "#f7f7f7",
          }}
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
              {i18n.t("assigned_to_label")}:{" "}
              <Text style={styles.text}> {issue.assignee}</Text>
            </Text>
            <Text style={styles.subtitle}>
              {i18n.t("reporter_label")}:{" "}
              <Text style={styles.text}> {issue?.reporter?.name}</Text>
            </Text>
            <Text style={styles.subtitle}>
              {i18n.t("citizen_label")}:{" "}
              <Text style={styles.text}> {issue?.citizen}</Text>
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.subtitle}>
              {i18n.t("privacy_label")}: <Text style={styles.text}>--</Text>
            </Text>
            <Text style={styles.subtitle}>
              {i18n.t("category_label")}:{" "}
              <Text style={styles.text}> {issue.category}</Text>
            </Text>
            <Text style={styles.subtitle}>
              {i18n.t("issue_type_label")}:{" "}
              <Text style={styles.text}> {issue.type}</Text>
            </Text>
          </View>
        </View>
        <CustomSeparator />
        <Text style={styles.title}>{i18n.t("attachments_label")}</Text>
        {issue?.attachments.map((item) => (
          <Text style={[styles.text, { marginBottom: 10 }]}>{item.uri}</Text>
        ))}
        <CustomSeparator />
        <Text style={styles.title}>Activity</Text>
        {comments?.map((item) => (
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", marginVertical: 10, flex: 1 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: "#f5ba74",
                  borderRadius: 16,
                }}
              />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.text}>{item.name}</Text>
                <Text style={styles.text}>
                  {moment(item.due_at).format("DD-MMM-YYYY")}
                </Text>
              </View>
            </View>
            <Text style={styles.text}>{item.comment}</Text>
          </View>
        ))}

        <TextInput
          multiline
          numberOfLines={4}
          style={[styles.grmInput, { height: 80 }]}
          placeholder={i18n.t("comment_placeholder")}
          outlineColor={"#f6f6f6"}
          theme={theme}
          mode={"outlined"}
          value={newComment}
          onChangeText={(text) => setNewComment(text)}
        />

        <Button
          theme={theme}
          style={{ alignSelf: "center", margin: 24 }}
          labelStyle={{ color: "white", fontFamily: "Poppins_500Medium" }}
          mode="contained"
          onPress={onAddComment}
        >
          Add comment
        </Button>
      </View>
    </ScrollView>
  );
}

export default Content;

import React, { useEffect } from "react";
import { View, ScrollView, Text, Platform, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { styles } from "./Content.styles";
import { Button } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import LockImage from "../../../../../assets/lock.svg";
import { colors } from "../../../../utils/colors";
import { useBackHandler } from "@react-native-community/hooks";
import i18n from "i18n-js";

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

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
  const navigation = useNavigation();

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

  return (
    <ScrollView>
      <View style={{ padding: 23 }}>
        <Text style={styles.stepText}>{i18n.t("step_6")}</Text>
        <Text style={styles.stepSubtitle}>{i18n.t("step_4_subtitle")}</Text>
        <Text style={styles.stepDescription}>
          {i18n.t("step_4_description")}
        </Text>
      </View>

      <LockImage
        style={{ alignSelf: "center" }}
        height={screenHeight * 0.2}
        width={screenWidth * 0.5}
      />
      <Text style={[styles.stepSubtitle, { textAlign: "center" }]}>
        {i18n.t("step_4_issue_code")}
      </Text>
      <Text
        style={{
          fontSize: 49,
          fontWeight: "bold",
          textAlign: "center",
          color: colors.primary,
          marginBottom: 40,
        }}
      >
        {issue.tracking_code}
      </Text>
      <View style={{ alignSelf: "center" }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginBottom: 23,
          }}
        >
          <Button
            theme={theme}
            style={{
              alignSelf: "center",
              marginRight: 7,
              backgroundColor: "#dedede",
            }}
            labelStyle={{ color: "white", fontFamily: "Poppins_500Medium" }}
            mode="contained"
            onPress={() => console.log("Pressed")}
          >
            {i18n.t("step_4_short_code")}
          </Button>
          <Button
            theme={theme}
            style={{
              alignSelf: "center",
              marginLeft: 7,
              backgroundColor: "#dedede",
            }}
            labelStyle={{ color: "white", fontFamily: "Poppins_500Medium" }}
            mode="contained"
            onPress={() => console.log("Pressed")}
          >
            {i18n.t("step_4_two_word_code")}
          </Button>
        </View>

        <Button
          theme={theme}
          labelStyle={{ color: "white", fontFamily: "Poppins_500Medium" }}
          mode="contained"
          onPress={() => navigation.navigate("GRM")}
        >
          {i18n.t("step_4_back_text")}
        </Button>
      </View>
    </ScrollView>
  );
}

export default Content;

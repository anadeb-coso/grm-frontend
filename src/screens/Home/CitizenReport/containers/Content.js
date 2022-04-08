import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Text,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { styles } from "./Content.styles";
import { Button, RadioButton, TextInput } from "react-native-paper";
import { colors } from "../../../../utils/colors";
import CustomDropDownPicker from "../../../../components/CustomDropDownPicker/CustomDropDownPicker";
import i18n from "i18n-js";

const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: "white",
    placeholder: "#dedede",
    text: "#707070",
  },
};

function Content() {
  const navigation = useNavigation();
  const [value, setValue] = React.useState("facilitator");
  const [dropdownDisabled, setDropdownDisabled] = React.useState(true);
  const [contactMethodError, setContactMethodError] = React.useState();
  const [contactInfo, setContactInfo] = React.useState("");
  const [pickerValue, setPickerValue] = useState("email");
  const [items, setItems] = useState([
    { label: i18n.t("step_1_method_1"), value: "phone_number" },
    { label: i18n.t("step_1_method_2"), value: "whatsapp" },
    { label: i18n.t("step_1_method_3"), value: "email" },
  ]);
  useEffect(() => {
    if (value === "channel-alert") {
      setDropdownDisabled(false);
    } else {
      setDropdownDisabled(true);
    }
  }, [value, pickerValue]);
  return (
    <ScrollView>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "position" : null}
      >
        <View style={{ padding: 23 }}>
          <Text style={styles.stepText}>{i18n.t("step_1")}</Text>
          <Text style={styles.stepDescription}>
            {i18n.t("stay_touch_question")}
          </Text>
          <Text style={styles.stepNote}>{i18n.t("step_1_hint_1")}</Text>
          <RadioButton.Group
            onValueChange={(newValue) => setValue(newValue)}
            value={value}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <RadioButton.Android
                value="anonymous"
                uncheckedColor={"#dedede"}
                color={colors.primary}
              />
              <Text style={styles.radioLabel}>{i18n.t("step_1_option_1")}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <RadioButton.Android
                value="facilitator"
                uncheckedColor={"#dedede"}
                color={colors.primary}
              />
              <Text style={styles.radioLabel}>{i18n.t("step_1_option_2")}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <RadioButton.Android
                value="channel-alert"
                uncheckedColor={"#dedede"}
                color={colors.primary}
              />
              <Text style={styles.radioLabel}>{i18n.t("step_1_option_3")}</Text>
            </View>
          </RadioButton.Group>
        </View>
        {!dropdownDisabled && (
          <>
            <CustomDropDownPicker
              disabled={dropdownDisabled}
              placeholder={i18n.t("step_1_placeholder_1")}
              value={pickerValue}
              items={items}
              setPickerValue={setPickerValue}
              setItems={setItems}
            />
            <View style={{ paddingHorizontal: 50 }}>
              <TextInput
                style={styles.grmInput}
                placeholder={i18n.t("step_1_placeholder_2")}
                outlineColor={"#f6f6f6"}
                theme={theme}
                error={contactMethodError}
                mode={"outlined"}
                value={contactInfo}
                onChangeText={(text) => {
                  setContactMethodError();
                  setContactInfo(text);
                }}
              />
            </View>
          </>
        )}
        <View style={{ paddingHorizontal: 50 }}>
          <Button
            theme={theme}
            style={{ alignSelf: "center", margin: 24 }}
            labelStyle={{ color: "white", fontFamily: "Poppins_500Medium" }}
            mode="contained"
            onPress={() => {
              if (!dropdownDisabled) {
                if (contactInfo) {
                  navigation.navigate("CitizenReportContactInfo", {
                    stepOneParams: {
                      typeOfPerson: value,
                      methodOfContact: pickerValue,
                      contactInfo,
                    },
                  });
                } else {
                  setContactMethodError(
                    "Please insert a valid method of contact"
                  );
                }
              } else {
                navigation.navigate("CitizenReportContactInfo", {
                  stepOneParams: {
                    typeOfPerson: value,
                    methodOfContact: pickerValue,
                    contactInfo,
                  },
                });
              }
            }}
          >
            {i18n.t("next")}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

export default Content;

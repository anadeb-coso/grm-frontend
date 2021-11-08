import React, { useState } from "react";
import {
  View,
  ScrollView,
  Text,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { styles } from "./Content.styles";
import { Button, TextInput, Checkbox } from "react-native-paper";
import { colors } from "../../../../utils/colors";
import i18n from "i18n-js";
import CustomDropDownPicker from "../../../../components/CustomDropDownPicker/CustomDropDownPicker";

const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: "white",
    placeholder: "#dedede",
    text: "#707070",
  },
};

function Content({ stepOneParams }) {
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [checked, setChecked] = useState(false);
  const [contactMethodError, setContactMethodError] = React.useState();
  const [isPreviousPickerClosed, setIsPreviousPickerClosed] = useState(true);
  const [pickerAgeValue, setPickerAgeValue] = useState(null);
  const [ages, setAges] = useState([
    { label: "16-19", value: "16-19" },
    { label: "20-29", value: "20-29" },
    { label: "30-39", value: "30-39" },
    { label: "40-49", value: "40-49" },
    { label: "50-59", value: "50-59" },
    { label: "60-69", value: "60-69" },
    { label: "70-79", value: "70-79" },
    { label: "80+", value: "80+" },
  ]);
  const [pickerGenderValue, setPickerGenderValue] = useState(null);
  const [genders, setGenders] = useState([
    { label: i18n.t("male"), value: "male" },
    { label: i18n.t("female"), value: "female" },
  ]);

  return (
    <ScrollView>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "position" : null}
      >
        <View style={{ padding: 23 }}>
          <Text style={styles.stepText}>{i18n.t("step_2")}</Text>
          <Text style={styles.stepDescription}>
            {i18n.t("contact_step_subtitle")}
          </Text>
          <Text style={styles.stepNote}>
            {i18n.t("contact_step_explanation")}
          </Text>
        </View>

        <View style={{ paddingHorizontal: 50 }}>
          <TextInput
            style={styles.grmInput}
            placeholder={i18n.t("contact_step_placeholder_1")}
            outlineColor={"#f6f6f6"}
            theme={theme}
            mode={"outlined"}
            value={name}
            error={contactMethodError}
            onChangeText={(text) => {
              setContactMethodError();
              setName(text);
            }}
          />
          <Text />
          <View style={{ flexDirection: "row" }}>
            <Checkbox.Android
              color={colors.primary}
              status={checked ? "checked" : "unchecked"}
              onPress={() => {
                setChecked(!checked);
              }}
            />
            <Text style={[styles.stepNote, { flex: 1 }]}>
              {i18n.t("contact_step_placeholder_4")}
            </Text>
          </View>
        </View>
        <Text />
        <CustomDropDownPicker
          placeholder={i18n.t("contact_step_placeholder_2")}
          value={pickerAgeValue}
          onOpen={() => setIsPreviousPickerClosed(false)}
          onClose={() => setIsPreviousPickerClosed(true)}
          items={ages}
          setPickerValue={setPickerAgeValue}
          setItems={setAges}
        />
        {isPreviousPickerClosed && (
          <>
            <CustomDropDownPicker
              placeholder={i18n.t("contact_step_placeholder_3")}
              value={pickerGenderValue}
              items={genders}
              setPickerValue={setPickerGenderValue}
              setItems={setGenders}
            />
            <View style={{ paddingHorizontal: 50 }}>
              <Button
                theme={theme}
                style={{ alignSelf: "center", margin: 24 }}
                labelStyle={{ color: "white", fontFamily: "Poppins_500Medium" }}
                mode="contained"
                onPress={() => {
                  if (name) {
                    navigation.navigate("CitizenReportStep2", {
                      stepOneParams: {
                        ...stepOneParams,
                        name,
                        ageGroup: pickerAgeValue,
                        gender: pickerGenderValue,
                        filledOnSomebodyElseBehalf: checked,
                      },
                    });
                  } else {
                    setContactMethodError(
                      "Please insert a valid method of contact"
                    );
                  }
                }}
              >
                {i18n.t("save_button_text")}
              </Button>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

export default Content;

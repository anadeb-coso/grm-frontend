import React, {useEffect, useState} from "react";
import {
  View,
  ScrollView,
  Text,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { styles } from "./Content.styles";
import {Button, TextInput, Checkbox, RadioButton} from "react-native-paper";
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

function Content({ stepOneParams, issueAges, citizenGroupsI, citizenGroupsII }) {
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [checked, setChecked] = useState(false);
  const [contactMethodError, setContactMethodError] = React.useState();
  const [isPreviousPickerClosed, setIsPreviousPickerClosed] = useState(true);
  const [pickerAgeValue, setPickerAgeValue] = useState(null);
  const [confidentialValue, setConfidentialValue] = useState(null);
  const [selectedCitizenGroupI, setSelectedCitizenGroupI] = useState(null);
  const [selectedCitizenGroupII, setSelectedCitizenGroupII] = useState(null);
  const [_citizenGroupsI, setCitizenGroupsI] = useState(citizenGroupsI ?? []);
  const [_citizenGroupsII, setCitizenGroupsII] = useState(citizenGroupsII ?? []);
  const [ages, setAges] = useState(issueAges ?? []);
  const [pickerGenderValue, setPickerGenderValue] = useState(null);
  const [genders, setGenders] = useState([
    { label: i18n.t("male"), value: "male" },
    { label: i18n.t("female"), value: "female" },
    { label: "Other", value: "other" },
    { label: "Rather not say", value: "rather_not_say" },
  ]);

  useEffect(() => {
    if (citizenGroupsI) {
      setCitizenGroupsI(citizenGroupsI);
    }
    if (citizenGroupsII) {
      setCitizenGroupsII(citizenGroupsII);
    }
    if (issueAges) {
      setAges(issueAges);
    }

  }, [citizenGroupsI, citizenGroupsII]);

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
          <RadioButton.Group
              onValueChange={(newValue) => {
                if(newValue == confidentialValue){
                  setConfidentialValue(0)
                } else {
                  setConfidentialValue(newValue)
                }
              }}
              value={confidentialValue}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 5 }}>
              <RadioButton.Android
                  value={1}
                  uncheckedColor={"#dedede"}
                  color={colors.primary}
              />
              <Text style={styles.radioLabel}>Keep name confidential.  Only the person resolving the issue will see the name. </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 5 }}>
              <RadioButton.Android
                  value={2}
                  uncheckedColor={"#dedede"}
                  color={colors.primary}
              />
              <Text style={styles.radioLabel}>This is an individual filing on behalf of someone else. </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 5 }}>
              <RadioButton.Android
                  value={3}
                  uncheckedColor={"#dedede"}
                  color={colors.primary}
              />
              <Text style={styles.radioLabel}>This is an organization filing on behalf of someone else.</Text>
            </View>
          </RadioButton.Group>

        </View>
        <Text />
        <CustomDropDownPicker
            schema={{
              label: "name",
              value: "id",
            }}
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
            <CustomDropDownPicker
                schema={{
                  label: "name",
                  value: "id",
                }}
                placeholder={'Citizen Group I'}
                value={selectedCitizenGroupI}
                items={_citizenGroupsI}
                setPickerValue={setSelectedCitizenGroupI}
                setItems={setCitizenGroupsI}
            />
            <CustomDropDownPicker
                schema={{
                  label: "name",
                  value: "id",
                }}
                placeholder={'Citizen Group II'}
                value={selectedCitizenGroupII}
                items={_citizenGroupsII}
                setPickerValue={setSelectedCitizenGroupII}
                setItems={setCitizenGroupsII}
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
                        citizen_type: confidentialValue,
                        citizen_group_1: selectedCitizenGroupI,
                        citizen_group_2: selectedCitizenGroupII,
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
                {i18n.t("next")}
              </Button>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

export default Content;

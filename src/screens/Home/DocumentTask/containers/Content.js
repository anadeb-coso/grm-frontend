import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  TextInput,
  Platform,
  ScrollView,
  Alert,
  Dimensions,
  ImageBackground,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import CurrencyInput from "react-native-currency-input";
import { ActivityIndicator, Text } from "react-native-paper";
import { FontAwesome5, AntDesign } from "@expo/vector-icons";
import { styles } from "./Content.styles";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import CustomGreenButton from "../../../../components/CustomGreenButton/CustomGreenButton";
import moment from "moment";
import "moment/locale/fr";
import LocalDatabase from "../../../../utils/databaseManager";
import * as Location from "expo-location";
import { colors } from "../../../../utils/colors";
import { baseURL } from "../../../../services/API";
import CustomDropDownPicker from "../../../../components/CustomDropDownPicker/CustomDropDownPicker";
import * as ImageManipulator from "expo-image-manipulator";

moment.locale("fr");
const screenWidth = Dimensions.get("window").width;

function Content({ task, phase, eadl, updatePhase }) {
  const navigation = useNavigation();
  const [status, setStatus] = useState(task.status);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState(task.notes);
  const [open, setOpen] = useState(false);
  const [pickerValue, setPickerValue] = useState(task.status);
  const [attachments, setAttachments] = useState(task.attachments || []);
  const [amount, setAmount] = useState(task.bp_amount || 0);
  const isBugetElaborationTask = typeof task.bp_amount !== "undefined";

  const getLocation = async () => {
    let { status } = await Location.requestPermissionsAsync();
    if (status !== "granted") {
      // setErrorMsg("Permission to access location was denied");
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    return location;
  };
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled) {
      const manipResult = await ImageManipulator.manipulateAsync(
        result.localUri || result.uri,
        [{ resize: { width: 1000, height: 1000 } }],
        { compress: 1, format: ImageManipulator.SaveFormat.PNG }
      );
      setAttachments([
        ...attachments,
        {
          url: "",
          id: new Date(),
          uploaded: false,
          local_url: manipResult.uri,
        },
      ]);
    }
  };
  const onChangeNotes = (text) => {
    task.notes = text;
    setNotes(text);
  };
  const onChangeStatus = (value) => {
    task.status = value;
    if (value === "completed") {
      task.closed_at = moment();
    } else {
      task.closed_at = "";
    }
    setStatus(value);
  };
  const onChangeAmount = (value) => {
    if (value === null) value = 0;
    task.bp_amount = value;
    setAmount(value);
  };
  const doSave = async (data) => {
    setLoading(true);
    const _location = await getLocation();
    task.attachments = attachments;
    task.location = _location;
    LocalDatabase.upsert(eadl._id, function (doc) {
      doc.phases = eadl.phases;
      return doc;
    })
      .then(function (res) {
        setLoading(false);
        setTimeout(() => updatePhase(), 500);
        navigation.goBack();
        // success, res is {rev: '1-xxx', updated: true, id: 'myDocId'}
      })
      .catch(function (err) {
        console.log("Error", err);
        // error
      });
  };
  const onAttachmentRemove = (id) => {
    const newList = attachments.filter((item) => item.id !== id);
    setAttachments(newList);
    //TODO: implement back button prompt to discard changes

    // Alert.alert(
    //   "Remove Attachment",
    //   "Are you sure you want to remove this attachment?",
    //   [
    //     {
    //       text: "Cancel",
    //       onPress: () => console.log("Cancel Pressed"),
    //       style: "cancel",
    //     },
    //     {
    //       text: "OK",
    //       onPress: () => {
    //         const newList = attachments.filter((item) => item.id !== id);
    //         setAttachments(newList);
    //       },
    //     },
    //   ]
    // );
  };

  const onSaveTask = async (data) => {
    if (
      isBugetElaborationTask === true &&
      status === "completed" &&
      amount === 0
    ) {
      Alert.alert(
        "Attention",
        "Êtes-vous sûre de terminer cette tâche avec un montant à O GNF?",
        [
          { text: "Non", style: "cancel" },
          {
            text: "Oui",
            onPress: async () => await doSave(data),
            style: "yes",
          },
        ]
      );
      return;
    }
    await doSave(data);
  };
  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const {
          status,
        } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          alert("Sorry, we need camera roll permissions to make this work!");
        }
      }
    })();
  }, []);
  return (
    <ScrollView
      contentContainerStyle={{
        justifyContent: "space-between",
        flexGrow: 1,
        paddingBottom: 30,
      }}
      style={{ padding: 20, flex: 1 }}
    >
      <View>
        <View style={styles.cardDateContainer}>
          <FontAwesome5
            style={{ marginLeft: 10, marginRight: 13 }}
            name="calendar-alt"
            size={15}
            color="#f5ba74"
          />
          <Text style={styles.cardDateText}>
            {moment(task.open_at).format("MMMM-yyyy")}-
            {moment(task.due_at).format("MMMM-yyyy")}
          </Text>
        </View>
        <Text
          style={{
            fontFamily: "Poppins_700Bold",
            fontSize: 20,
            color: "#707070",
          }}
        >
          {task.title}
        </Text>
        <Text
          style={{
            fontFamily: "Poppins_400Regular",
            fontSize: 14,
            lineHeight: 16,
            color: "#707070",
          }}
        >
          {task.description}
        </Text>
        <Text
          style={{
            marginTop: 10,
            fontFamily: "Poppins_700Bold",
            fontSize: 12,
            color: "#707070",
          }}
        >
          Status
        </Text>
        <View style={{ alignContent: "flex-start" }}>
          <CustomDropDownPicker
            items={[
              {
                label: "Pas commencé",
                value: "not-started",
                // hidden: true,
              },
              {
                label: "En cours",
                value: "in-progress",
              },
              {
                label: "Complété",
                value: "completed",
              },
            ]}
            customDropdownWrapperStyle={{
              marginHorizontal: 0,
              alignSelf: "flex-start",
              marginRight: screenWidth / 3,
            }}
            onChangeValue={onChangeStatus}
            open={open}
            value={pickerValue}
            setOpen={setOpen}
            setPickerValue={(newValue) => setPickerValue(newValue)}
            ArrowDownIconComponent={() => (
              <FontAwesome5
                name="chevron-circle-down"
                size={12}
                color="#24c38b"
              />
            )}
            ArrowUpIconComponent={() => (
              <FontAwesome5
                name="chevron-circle-up"
                size={12}
                color="#24c38b"
              />
            )}
          />
        </View>
        {isBugetElaborationTask && (
          <CurrencyInput
            value={amount}
            onChangeValue={onChangeAmount}
            unit="GNF "
            delimiter="."
            separator=","
            precision={0}
            style={{
              width: "70%",
              borderRadius: 7,
              backgroundColor: "#ffffff",
              borderStyle: "solid",
              borderWidth: 1,
              borderColor: "#d9d9d9",
              padding: 5,
              marginTop: 10,
            }}
          />
        )}
        <TouchableOpacity
          onPress={pickImage}
          style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}
        >
          <Feather name="plus" size={24} color="#00bc82" />
          <Text
            style={{
              fontFamily: "Poppins_700Bold",
              fontSize: 14,
              lineHeight: 21,
              letterSpacing: 0,
              textAlign: "left",
              color: "#707070",
            }}
          >
            Upload picture of the activity
          </Text>
        </TouchableOpacity>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {attachments &&
            attachments.map((item) => (
              <ImageBackground
                source={{
                  uri:
                    item?.url?.length > 0
                      ? `${baseURL}${item.url}`
                      : item.local_url,
                }}
                style={{
                  marginHorizontal: 5,
                  marginTop: 10,
                  width: 100,
                  height: 100,
                  borderRadius: 15,
                  alignItems: "flex-end",
                }}
              >
                <TouchableOpacity onPress={() => onAttachmentRemove(item.id)}>
                  <AntDesign
                    style={{ margin: 10 }}
                    name="closecircle"
                    size={15}
                    color={"#707070"}
                  />
                </TouchableOpacity>
              </ImageBackground>
            ))}
        </View>

        <Text
          style={{
            marginTop: 15,
            fontFamily: "Poppins_400Regular",
            fontSize: 12,
            lineHeight: 18,
            letterSpacing: 0,
            textAlign: "left",
            color: "#707070",
          }}
        >
          Notes
        </Text>
        <TextInput
          placeholder="Task Notes"
          multiline
          numberOfLines={5}
          style={{
            borderRadius: 7,
            backgroundColor: "#ffffff",
            borderStyle: "solid",
            borderWidth: 1,
            borderColor: "#d9d9d9",
            height: 141,
            padding: 11,
            paddingTop: 11,
            marginBottom: 10,
          }}
          value={notes}
          onChangeText={onChangeNotes}
        />
      </View>
      {loading ? (
        <ActivityIndicator
          style={{ marginVertical: 10 }}
          color={colors.primary}
        />
      ) : (
        <CustomGreenButton
          onPress={onSaveTask}
          buttonStyle={{ width: "100%", height: 36, borderRadius: 7 }}
          textStyle={{
            fontFamily: "Poppins_500Medium",
            fontSize: 14,
            lineHeight: 21,
            letterSpacing: 0,
            textAlign: "right",
            color: "#ffffff",
          }}
        >
          ENREGISTER
        </CustomGreenButton>
      )}
    </ScrollView>
  );
}

export default Content;

import React, { useState } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
} from "react-native";
import { Divider, Modal } from "react-native-paper";
import { FontAwesome5 } from "@expo/vector-icons";
import { styles } from "./RegisterVotesActivity.style";
import moment from "moment";
import "moment/locale/fr";
import CustomGreenButton from "../../../components/CustomGreenButton/CustomGreenButton";
import { colors } from "../../../utils/colors";
import LocalDatabase from "../../../utils/databaseManager";
import { useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

const window = Dimensions.get("window");
moment.locale("fr");

function RegisterVotesActivity() {
  const { params } = useRoute();
  const { eadl, update } = params;
  const [project, setProject] = useState();
  const [registerVotesModal, setRegisterVotesModal] = useState();
  const [voteYM, setvoteYM] = useState();
  const [voteYF, setvoteYF] = useState();
  const [voteMM, setvoteMM] = useState();
  const [voteMF, setvoteMF] = useState();
  const [voteOM, setvoteOM] = useState();
  const [voteOF, setvoteOF] = useState();
  const dismissModal = () => {
    setProject(undefined);
    setRegisterVotesModal(false);
  };

  const upsertTasks = () => {
    LocalDatabase.upsert(eadl._id, function (doc) {
      doc = eadl;
      return doc;
    })
      .then(function (res) {
        setTimeout(() => update(), 500);
        dismissModal();
      })
      .catch(function (err) {
        console.log("Error", err);
        // error
      });
  };

  const doSave = () => {
    project.vote_ym = voteYM ?? 0;
    project.vote_yf = voteYF ?? 0;
    project.vote_mm = voteMM ?? 0;
    project.vote_mf = voteMF ?? 0;
    project.vote_om = voteOM ?? 0;
    project.vote_of = voteOF ?? 0;
    upsertTasks();
  };

  const onSaveProject = async () => {
    Alert.alert("Attention", "Êtes-vous sûr de vouloir modifier les votes?", [
      { text: "Non", style: "cancel" },
      {
        text: "Oui",
        onPress: async () => await doSave(),
        style: "yes",
      },
    ]);
  };

  return (
    <View style={{ flex: 1, paddingTop: 10 }}>
      <FlatList
        showsVerticalScrollIndicator={false}
        data={eadl.bp_projects ?? []}
        contentContainerStyle={{ padding: 21 }}
        style={{ flex: 1 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          return (
            <View style={styles.cardContainer}>
              <View>
                <View style={styles.cardHeader}>
                  <View style={{ flexDirection: "row", flex: 1 }}>
                    <Text numberOfLines={2} style={styles.cardNameText}>
                      {item.subproject_name}
                    </Text>
                  </View>
                </View>
                <View style={{ marginVertical: 10, marginLeft: 10 }}>
                  <Text style={styles.cardDescriptionText}>
                    {item.subproject_description}
                  </Text>
                </View>
                <Divider
                  style={{ marginVertical: 8, backgroundColor: "#f6f6f6" }}
                />
                <View style={styles.cardFooter}>
                  <View style={styles.cardVotesContainer}>
                    <Text
                      style={[styles.cardVotesText, { color: colors.primary }]}
                    >
                      {"9,835,717.59"} GNF
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={{ marginRight: 10 }}
                    onPress={() => {
                      setProject(item);
                      setvoteYM(item.vote_ym);
                      setvoteYF(item.vote_yf);
                      setvoteMM(item.vote_mm);
                      setvoteMF(item.vote_mf);
                      setvoteOM(item.vote_om);
                      setvoteOF(item.vote_of);
                      setRegisterVotesModal(true);
                    }}
                  >
                    <View
                      style={[
                        styles.cardVotesContainer,
                        {
                          backgroundColor: colors.primary,
                          alignItems: "center",
                          justifyContent: "center",
                          paddingHorizontal: 30,
                        },
                      ]}
                    >
                      <Text style={[styles.cardVotesText, { color: "white" }]}>
                        ENREGISTER
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />
      <Modal
        onDismiss={dismissModal}
        dismissable
        visible={registerVotesModal}
        contentContainerStyle={{ padding: 20 }}
      >
        <KeyboardAvoidingView
          enabled
          behavior={Platform.OS === "android" ? undefined : "position"}
        >
          <View style={styles.modalContainerStyle}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: window.height > 800 ? 80 : 0,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={styles.modalTitle}>Votes</Text>
                <TouchableOpacity onPress={dismissModal}>
                  <FontAwesome5
                    // style={{ marginLeft: 10, marginRight: 13 }}
                    name="times-circle"
                    size={15}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>
              <LinearGradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                colors={["#7488f5", "#a3fffb"]}
                style={styles.voteGenreLabel}
              >
                <Text style={styles.modalFieldTitle}>Homme</Text>
              </LinearGradient>

              <View style={styles.votesInputContainer}>
                <View style={styles.cardDateContainer}>
                  <Text style={[styles.cardNameText]}>Jeunne 15-40</Text>
                </View>
                <View style={styles.votesInput}>
                  <TextInput
                    value={voteYM}
                    keyboardType={"numeric"}
                    onChangeText={(text) => setvoteYM(text)}
                    placeholder={"Votes"}
                    style={styles.votesTextInput}
                  />
                </View>
              </View>
              <View style={styles.votesInputContainer}>
                <View style={styles.cardDateContainer}>
                  <Text style={[styles.cardNameText]}>Adullte 40-65</Text>
                </View>
                <View style={styles.votesInput}>
                  <TextInput
                    value={voteMM}
                    keyboardType={"numeric"}
                    onChangeText={(text) => setvoteMM(text)}
                    placeholder={"Votes"}
                    style={styles.votesTextInput}
                  />
                </View>
              </View>
              <View style={styles.votesInputContainer}>
                <View style={styles.cardDateContainer}>
                  <Text style={[styles.cardNameText]}>Vieux 65+</Text>
                </View>
                <View style={styles.votesInput}>
                  <TextInput
                    value={voteOM}
                    keyboardType={"numeric"}
                    onChangeText={(text) => setvoteOM(text)}
                    placeholder={"Votes"}
                    style={styles.votesTextInput}
                  />
                </View>
              </View>
              <LinearGradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                colors={["#9858ff", "#ff8bf2"]}
                style={styles.voteGenreLabel}
              >
                <Text style={styles.modalFieldTitle}>Femme</Text>
              </LinearGradient>

              <View style={styles.votesInputContainer}>
                <View style={styles.cardDateContainer}>
                  <Text style={[styles.cardNameText]}>Jeunne 15-40</Text>
                </View>
                <View style={styles.votesInput}>
                  <TextInput
                    value={voteYF}
                    keyboardType={"numeric"}
                    onChangeText={(text) => setvoteYF(text)}
                    placeholder={"Votes"}
                    style={styles.votesTextInput}
                  />
                </View>
              </View>
              <View style={styles.votesInputContainer}>
                <View style={styles.cardDateContainer}>
                  <Text style={[styles.cardNameText]}>Adullte 40-65</Text>
                </View>
                <View style={styles.votesInput}>
                  <TextInput
                    value={voteMF}
                    keyboardType={"numeric"}
                    onChangeText={(text) => setvoteMF(text)}
                    placeholder={"Votes"}
                    style={styles.votesTextInput}
                  />
                </View>
              </View>
              <View style={styles.votesInputContainer}>
                <View style={styles.cardDateContainer}>
                  <Text style={[styles.cardNameText]}>Vieux 65+</Text>
                </View>
                <View style={styles.votesInput}>
                  <TextInput
                    value={voteOF}
                    keyboardType={"numeric"}
                    onChangeText={(text) => setvoteOF(text)}
                    placeholder={"Votes"}
                    style={styles.votesTextInput}
                  />
                </View>
              </View>
            </ScrollView>
            <CustomGreenButton
              onPress={onSaveProject}
              buttonStyle={styles.greenButtonStyle}
              textStyle={styles.greenButtonText}
            >
              ENREGISTER
            </CustomGreenButton>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

export default RegisterVotesActivity;

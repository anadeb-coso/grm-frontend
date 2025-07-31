import React, { useState } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { Divider, Modal } from "react-native-paper";
import { FontAwesome5 } from "@expo/vector-icons";
import { styles } from "./RegisterSubprojects.style";
import moment from "moment";
import "moment/locale/fr";
import CustomGreenButton from "../../../components/CustomGreenButton/CustomGreenButton";
import { colors } from "../../../utils/colors";
import LocalDatabase from "../../../utils/databaseManager";
import { useNavigation, useRoute } from "@react-navigation/native";

moment.locale("fr");

function RegisterSubprojects() {
  const navigation = useNavigation();
  const { params } = useRoute();
  const { eadl } = params;
  const [createProjectModal, setCreateProjectModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bpProjects, setBpProjects] = useState(eadl.bp_projects || []);
  const [subProjectName, setSubProjectName] = useState("");
  const [subProjectDesc, setSubProjectDesc] = useState("");
  const [subProjectLocation, setSubProjectLocation] = useState("");
  const [projectToEdit, setProjectToEdit] = useState();
  const incrementId = () => {
    const last = eadl.bp_projects[eadl.bp_projects.length - 1];
    if (!eadl.bp_projects[0]) return 1;
    else return parseInt(last.id.split("-")[1]) + 1;
  };
  const dismissModal = () => {
    setLoading(false);
    setSubProjectName("");
    setSubProjectDesc("");
    setSubProjectLocation("");
    setProjectToEdit(undefined);
    setCreateProjectModal(false);
  };
  const upsertTasks = () => {
    LocalDatabase.upsert(eadl._id, function (doc) {
      doc = eadl;
      return doc;
    })
      .then(function (res) {
        dismissModal();
      })
      .catch(function (err) {
        console.log("Error", err);
        // error
      });
  };
  const addSubproject = () => setCreateProjectModal(!createProjectModal);

  const editSubproject = ({
    id,
    district_name,
    subproject_name,
    subproject_description,
  }) => {
    setCreateProjectModal(!createProjectModal);
    setProjectToEdit(id);
    setSubProjectName(subproject_name);
    setSubProjectDesc(subproject_description);
    setSubProjectLocation(district_name);
  };

  const removeProject = (project) => {
    Alert.alert("Attention", "Voulez-vous vraiment supprimer ce projet?", [
      { text: "Non", style: "cancel" },
      {
        text: "Oui",
        onPress: async () => {
          const updatedSubProjects = bpProjects.filter(
            (item) => item.id !== project.id
          );
          setBpProjects(updatedSubProjects);
          eadl.bp_projects = updatedSubProjects;
          upsertTasks();
        },
        style: "yes",
      },
    ]);
    return;
  };
  const onChangeName = (text) => setSubProjectName(text);
  const onChangeDescription = (text) => setSubProjectDesc(text);
  const onChangeLocation = (text) => setSubProjectLocation(text);
  const doSave = async () => {
    setLoading(true);
    if (projectToEdit) {
      //Edit project
      const updatedData = eadl.bp_projects.map((x) =>
        x.id === projectToEdit
          ? {
              ...x,
              district_name: subProjectLocation,
              subproject_name: subProjectName,
              subproject_description: subProjectDesc,
            }
          : x
      );
      setBpProjects(updatedData);
      eadl.bp_projects = updatedData;
    } else {
      //Create project
      const newId = incrementId();
      setBpProjects([
        ...bpProjects,
        {
          id: `${eadl.commune}-${newId}`,
          district_name: subProjectLocation,
          subproject_name: subProjectName,
          subproject_description: subProjectDesc,
          budget_allocated: [],
          vote_ym: "",
          vote_yf: "",
          vote_mm: "",
          vote_mf: "",
          vote_om: "",
          vote_of: "",
        },
      ]);
      eadl.bp_projects = [
        ...eadl.bp_projects,
        {
          id: `${eadl.commune}-${newId}`,
          district_name: subProjectLocation,
          subproject_name: subProjectName,
          subproject_description: subProjectDesc,
          budget_allocated: [],
          vote_ym: "",
          vote_yf: "",
          vote_mm: "",
          vote_mf: "",
          vote_om: "",
          vote_of: "",
        },
      ];
    }
    upsertTasks();
  };
  const onSaveTask = async () => {
    if (!!subProjectName && !!subProjectLocation) {
      Alert.alert(
        "Attention",
        projectToEdit
          ? "Êtes-vous sûr de vouloir modifier ce projet?"
          : "Êtes-vous sûr de vouloir créer ce projet?",
        [
          { text: "Non", style: "cancel" },
          {
            text: "Oui",
            onPress: async () => await doSave(),
            style: "yes",
          },
        ]
      );
      return;
    }
  };
  return (
    <View style={{ flex: 1, paddingTop: 10 }}>
      <CustomGreenButton
        onPress={addSubproject}
        buttonStyle={styles.greenButtonStyle}
        textStyle={styles.greenButtonText}
      >
        ADD NEW SUBPROJECT +
      </CustomGreenButton>
      <FlatList
        showsVerticalScrollIndicator={false}
        data={bpProjects}
        contentContainerStyle={{ padding: 21 }}
        style={{ flex: 1 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          return (
            <View style={styles.cardContainer}>
              <TouchableOpacity onPress={() => editSubproject(item)}>
                <View>
                  <View style={styles.cardHeader}>
                    <View style={{ flexDirection: "row", flex: 1 }}>
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={2} style={styles.cardNameText}>
                          {item.subproject_name}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Divider
                    style={{ marginVertical: 8, backgroundColor: "#f6f6f6" }}
                  />
                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.footerTitle}>Location</Text>
                      <View style={styles.cardDateContainer}>
                        <FontAwesome5
                          style={{ marginLeft: 10, marginRight: 13 }}
                          name="map-marker-alt"
                          size={15}
                          color="#f5ba74"
                        />
                        <Text style={styles.cardDateText}>
                          {item.district_name}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => removeProject(item)}>
                      <View
                        style={[
                          styles.cardDateContainer,
                          {
                            backgroundColor: colors.inProgress,
                            alignItems: "center",
                            justifyContent: "center",
                          },
                        ]}
                      >
                        <FontAwesome5
                          // style={{ marginLeft: 10, marginRight: 13 }}
                          name="map-marker-alt"
                          size={15}
                          color="#f5ba74"
                        />
                        <Text style={[styles.cardDateText, { color: "white" }]}>
                          REMOVE
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          );
        }}
      />
      <CustomGreenButton
        onPress={() => navigation.goBack()}
        buttonStyle={styles.greenButtonStyle}
        textStyle={styles.greenButtonText}
      >
        TERMINÉ
      </CustomGreenButton>
      <Modal
        onDismiss={dismissModal}
        dismissable
        visible={createProjectModal}
        contentContainerStyle={{ padding: 20 }}
      >
        <KeyboardAvoidingView
          enabled
          behavior={Platform.OS === "android" ? undefined : "position"}
        >
          <ScrollView>
            <View style={styles.modalContainerStyle}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={styles.modalTitle}>Register Activity</Text>
                <TouchableOpacity onPress={() => setCreateProjectModal(false)}>
                  <FontAwesome5
                    // style={{ marginLeft: 10, marginRight: 13 }}
                    name="times-circle"
                    size={15}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalFieldTitle}>Nom</Text>
              <TextInput
                style={styles.modalInput}
                onChangeText={onChangeName}
                value={subProjectName}
              />
              <Text style={styles.modalFieldTitle}>Location</Text>
              <TextInput
                style={styles.modalInput}
                onChangeText={onChangeLocation}
                value={subProjectLocation}
              />
              <Text style={styles.modalFieldTitle}>Description</Text>
              <TextInput
                multiline
                style={[styles.modalInput, { height: 80 }]}
                onChangeText={onChangeDescription}
                value={subProjectDesc}
              />
              <CustomGreenButton
                onPress={onSaveTask}
                buttonStyle={styles.greenButtonStyle}
                textStyle={styles.greenButtonText}
              >
                Register
              </CustomGreenButton>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

export default RegisterSubprojects;

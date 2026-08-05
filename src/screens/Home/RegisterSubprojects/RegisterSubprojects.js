import React, { useState, useEffect, useCallback } from "react";
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
import { Q } from "@nozbe/watermelondb";
import { styles } from "./RegisterSubprojects.style";
import moment from "moment";
import "moment/locale/fr";
import CustomGreenButton from "../../../components/CustomGreenButton/CustomGreenButton";
import { colors } from "../../../utils/colors";
import { database } from "../../../database";
import { createWithId } from "../../../database/utils/createWithId";
import { useNavigation, useRoute } from "@react-navigation/native";

moment.locale("fr");

function RegisterSubprojects() {
  const navigation = useNavigation();
  const { params } = useRoute();
  const { eadl } = params;
  const [createProjectModal, setCreateProjectModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bpProjects, setBpProjects] = useState([]);
  const [subProjectName, setSubProjectName] = useState("");
  const [subProjectDesc, setSubProjectDesc] = useState("");
  const [subProjectLocation, setSubProjectLocation] = useState("");
  const [projectToEdit, setProjectToEdit] = useState();

  const loadProjects = useCallback(async () => {
    const records = await database.get('bp_projects').query(Q.where('adl', eadl.id)).fetch();
    setBpProjects(records.map((r) => ({
      record: r,
      id: r.externalCode,
      district_name: r.districtName,
      subproject_name: r.subprojectName,
      subproject_description: r.subprojectDescription,
    })));
  }, [eadl]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const incrementId = () => {
    if (!bpProjects[0]) return 1;
    const last = bpProjects[bpProjects.length - 1];
    return parseInt(last.id.split("-")[1] || "0") + 1;
  };
  const dismissModal = () => {
    setLoading(false);
    setSubProjectName("");
    setSubProjectDesc("");
    setSubProjectLocation("");
    setProjectToEdit(undefined);
    setCreateProjectModal(false);
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
          await database.write(async () => {
            await project.record.markAsDeleted();
          });
          await loadProjects();
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
    try {
      if (projectToEdit) {
        const existing = bpProjects.find((x) => x.id === projectToEdit);
        await database.write(async () => {
          await existing.record.update((r) => {
            r.districtName = subProjectLocation;
            r.subprojectName = subProjectName;
            r.subprojectDescription = subProjectDesc;
          });
        });
      } else {
        const newId = incrementId();
        const externalCode = `${eadl.locationName || eadl.name || 'BP'}-${newId}`;
        await createWithId(database.get('bp_projects'), (r) => {
          r.adlId = eadl.id;
          r.externalCode = externalCode;
          r.districtName = subProjectLocation;
          r.subprojectName = subProjectName;
          r.subprojectDescription = subProjectDesc;
          r.voteYm = 0;
          r.voteYf = 0;
          r.voteMm = 0;
          r.voteMf = 0;
          r.voteOm = 0;
          r.voteOf = 0;
        });
      }
      await loadProjects();
      dismissModal();
    } catch (err) {
      console.log("Error", err);
      setLoading(false);
    }
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

import React, { useState } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from "react-native";
import { Divider } from "react-native-paper";
import { FontAwesome5 } from "@expo/vector-icons";
import { styles } from "./BudgetAllocation.styles";
import moment from "moment";
import "moment/locale/fr";
import CustomGreenButton from "../../../components/CustomGreenButton/CustomGreenButton";
import { colors } from "../../../utils/colors";
import LocalDatabase from "../../../utils/databaseManager";
import { useNavigation, useRoute } from "@react-navigation/native";
import "intl";
import "intl/locale-data/jsonp/en";

moment.locale("fr");

function RegisterSubprojects() {
  const navigation = useNavigation();
  const { params } = useRoute();
  const { eadl } = params;
  const [loading, setLoading] = useState(false);
  const [bpProjects, setBpProjects] = useState(eadl.bp_projects || []);
  const [mandatoryError, setMandatoryError] = useState(false);
  const [projectAmount, setProjectAmount] = useState(0);e
  const [projectAmountFormatted, setProjectAmountFormatted] = useState(0);
  const [subProjectDesc, setSubProjectDesc] = useState("");
  const [selectedProjectIndex, setSelectedProjectIndex] = useState();
  const [recordBudgetModal, setRecordBudgetModal] = useState(false);

  const upsertRecord = () => {
    LocalDatabase.upsert(eadl._id, function (doc) {
      doc = eadl;
      return doc;
    })
      .then(function (res) {
        hideRecordBudgetModal();
      })
      .catch(function (err) {
        console.log("Error", err);
        // error
      });
  };

  const goToBudgetLog = (project) => {
    navigation.navigate("BudgetLog", { project });
  };

  const showRecordBudgetModal = (item, index) => {
    setSelectedProjectIndex(index);
    setRecordBudgetModal(true);
  };
  const hideRecordBudgetModal = () => {
    setLoading(false);
    setSubProjectDesc("");
    setProjectAmount("");
    setProjectAmountFormatted("");
    setSelectedProjectIndex();
    setRecordBudgetModal(false);
  };

  const onChangeAmount = (text) => {
    const unformatted = text.replace(/,/g, "");
    const amountFormatted = new Intl.NumberFormat().format(unformatted);
    setProjectAmount(unformatted);
    setProjectAmountFormatted(amountFormatted);
  };
  const onChangeDescription = (text) => setSubProjectDesc(text);

  const doSave = async () => {
    setLoading(true);
    setMandatoryError(false);

    //Create project
    eadl.bp_projects[selectedProjectIndex].budget_allocated.push({
      timestamp: new Date(),
      description: subProjectDesc,
      formattedAmount: projectAmountFormatted,
      amount: projectAmount,
    });

    upsertRecord();
  };
  const onRegisterBudget = async () => {
    if (!!projectAmountFormatted && !!subProjectDesc) {
      Alert.alert("Attention", "Êtes-vous sûr de vouloir modifier ce projet?", [
        { text: "Non", style: "cancel" },
        {
          text: "Oui",
          onPress: async () => await doSave(),
          style: "yes",
        },
      ]);
      return;
    } else {
      setMandatoryError(true);
    }
  };

  const calculateBudgetUsed = ({ budget_allocated }) => {
    const result = budget_allocated.reduce(
      (total, obj) => parseInt(obj.amount) + total,
      0
    );
    const amountFormatted = new Intl.NumberFormat().format(result);
    return <Text>{amountFormatted}</Text>;
  };
  return (
    <View style={{ flex: 1, paddingTop: 10 }}>
      {/*<CustomGreenButton*/}
      {/*  onPress={addSubproject}*/}
      {/*  buttonStyle={styles.greenButtonStyle}*/}
      {/*  textStyle={styles.greenButtonText}*/}
      {/*>*/}
      {/*  ADD NEW SUBPROJECT +*/}
      {/*</CustomGreenButton>*/}
      {bpProjects.length > 0 && (
        <FlatList
          showsVerticalScrollIndicator={false}
          data={bpProjects}
          contentContainerStyle={{ padding: 21 }}
          style={{ flex: 1 }}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => {
            return (
              <View style={styles.cardContainer}>
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
                  <View style={[styles.cardFooter, { marginBottom: 8 }]}>
                    <View>
                      <Text style={{ color: "#707070", marginLeft: 10 }}>
                        Total Amount:
                      </Text>
                      <Text
                        style={[
                          styles.cardVotesText,
                          { color: colors.primary, marginLeft: 10 },
                        ]}
                      >
                        {calculateBudgetUsed(item)}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TouchableOpacity
                    style={{ alignSelf: "flex-start", marginRight: 7 }}
                    onPress={() => goToBudgetLog(item)}
                  >
                    <View
                      style={[
                        styles.cardDateContainer,
                        {
                          // backgroundColor: colors.inProgress,
                          alignItems: "center",
                          justifyContent: "center",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.cardDateText,
                          { color: colors.inProgress },
                        ]}
                      >
                        View Log
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    // style={{ marginRight: 10 }}
                    onPress={() => showRecordBudgetModal(item, index)}
                  >
                    <View
                      style={[
                        styles.cardDateContainer,
                        {
                          backgroundColor: colors.primary,
                          alignItems: "center",
                          justifyContent: "center",
                        },
                      ]}
                    >
                      <Text style={styles.cardDateText}>Record Budget</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
      <CustomGreenButton
        onPress={() => navigation.goBack()}
        buttonStyle={styles.greenButtonStyle}
        textStyle={styles.greenButtonText}
      >
        TERMINÉ
      </CustomGreenButton>
      <Modal
        onDismiss={hideRecordBudgetModal}
        dismissable
        animationType="slide"
        visible={recordBudgetModal}
        contentContainerStyle={{ padding: 20 }}
      >
        <KeyboardAvoidingView
          enabled
          behavior={Platform.OS === "android" ? undefined : "position"}
        >
          <View>
            <View style={styles.modalContainerStyle}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={styles.modalTitle}>Register Budget</Text>
                <TouchableOpacity onPress={hideRecordBudgetModal}>
                  <FontAwesome5
                    // style={{ marginLeft: 10, marginRight: 13 }}
                    name="times-circle"
                    size={15}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalFieldTitle}>
                Entrer le montant du budget
              </Text>
              <TextInput
                keyboardType={"numeric"}
                style={styles.modalInput}
                onChangeText={onChangeAmount}
                value={`${projectAmountFormatted}`}
              />

              <Text style={styles.modalFieldTitle}>
                Entrer le motif du budget
              </Text>
              <TextInput
                multiline
                style={[styles.modalInput, { height: 80 }]}
                onChangeText={onChangeDescription}
                value={subProjectDesc}
              />
              {mandatoryError && (
                <Text style={styles.errorText}>
                  Les champs montant et motif sont obligatoires
                </Text>
              )}
              <CustomGreenButton
                onPress={onRegisterBudget}
                buttonStyle={styles.greenButtonStyle}
                textStyle={styles.greenButtonText}
              >
                Register
              </CustomGreenButton>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

export default RegisterSubprojects;

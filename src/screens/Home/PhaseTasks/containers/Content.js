import React from "react";
import { View, FlatList, TouchableOpacity, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Divider, FAB } from "react-native-paper";
import { FontAwesome5 } from "@expo/vector-icons";
import { styles } from "./Content.styles";
import moment from "moment";
import "moment/locale/fr";
import { ImageBackground } from "react-native";
import TagIcon from "../../../../../assets/tag_solid.svg";
import LocalDatabase from "../../../../utils/databaseManager";

moment.locale("fr");

function Content({ eadl, phase }) {
  const navigation = useNavigation();
  const [update, setUpdate] = React.useState(false);
  const goToTaskDetail = (task) => {
    if (task.type === "multiple_list_activity") {
      //navigate to subtasks
      navigation.navigate("RegisterSubprojects", {
        task,
        phase,
        eadl,
        update: updatePhase,
      });
    } else if (task.type === "vote_activity") {
      navigation.navigate("RegisterVotesActivity", {
        task,
        phase,
        eadl,
        update: updatePhase,
      });
    } else if (task.type === "input_activity") {
      navigation.navigate("BudgetAllocation", {
        task,
        phase,
        eadl,
        // update: updatePhase,
      });
    } else {
      navigation.navigate("DocumentTask", {
        task,
        phase,
        eadl,
        update: updatePhase,
      });
    }
  };

  const updatePhase = () => {
    setUpdate(!update);
    const completedTasks = phase.tasks.filter(
      ({ status }) => status === "completed"
    ).length;
    if (completedTasks === phase.tasks.length) {
      phase.closed_at = moment();
    } else {
      phase.closed_at = null;
    }
    LocalDatabase.upsert(eadl._id, function (doc) {
      doc.phases = eadl.phases;
      return doc;
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={phase?.tasks || []}
        contentContainerStyle={{ padding: 21 }}
        keyExtractor={(item, index) => index.toString()}
        ItemSeparatorComponent={() => <View style={{ marginVertical: 10 }} />}
        renderItem={({ item, index }) => {
          const completedTasks = phase.tasks.filter(
            ({ status }) => status === "completed"
          ).length;
          return (
            <View style={styles.cardContainer}>
              <TouchableOpacity
                disabled={index >= completedTasks + 1}
                onPress={() => goToTaskDetail(item)}
                // style={styles.cardContainer}
                opacity={index >= completedTasks + 1 ? 0.5 : 1}
              >
                <View opacity={index >= completedTasks + 1 ? 0.5 : 1}>
                  <View style={styles.cardHeader}>
                    <View style={{ flexDirection: "row", flex: 1 }}>
                      <View style={styles.cardIdContainer}>
                        <View>
                          <ImageBackground
                            style={{
                              width: 30,
                              height: 30,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            source={require("../../../../../assets/rectangle_3623.png")}
                          >
                            <TagIcon
                              height={13}
                              width={13}
                              // style={{ marginTop: 100 }}
                            />
                          </ImageBackground>
                        </View>
                        <Text style={styles.cardIdText}>PDL</Text>
                      </View>
                      <View style={{ marginLeft: 13, flex: 1 }}>
                        <Text numberOfLines={2} style={styles.cardNameText}>
                          {item.title}
                        </Text>
                      </View>
                      {item.status === "completed" && (
                        <View style={styles.statusContainer}>
                          <Text style={styles.statusText}>Complété</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Divider
                    style={{ marginVertical: 8, backgroundColor: "#f6f6f6" }}
                  />
                  <View style={styles.cardFooter}>
                    {/*<View>*/}
                    {/*  <Text style={styles.footerTitle}>Location</Text>*/}
                    {/*  <View style={styles.cardDateContainer}>*/}
                    {/*    <FontAwesome5*/}
                    {/*      style={{ marginLeft: 10, marginRight: 13 }}*/}
                    {/*      name="map-marker-alt"*/}
                    {/*      size={15}*/}
                    {/*      color="#f5ba74"*/}
                    {/*    />*/}
                    {/*    <Text style={styles.cardDateText}>{item.address}</Text>*/}
                    {/*  </View>*/}
                    {/*</View>*/}
                    <View>
                      <Text style={styles.footerTitle}>Estimated Date</Text>
                      <View style={styles.cardDateContainer}>
                        <FontAwesome5
                          style={{ marginLeft: 10, marginRight: 13 }}
                          name="calendar-alt"
                          size={15}
                          color="#f5ba74"
                        />
                        <Text style={styles.cardDateText}>
                          {moment(item.open_at).format("MMMM-yyyy")}-
                          {moment(item.due_at).format("MMMM-yyyy")}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          );
        }}
      />
      <FAB
        style={styles.fab}
        icon="plus"
        small
        color={"white"}
        onPress={() => console.log("Pressed")}
      />
    </View>
  );
}

export default Content;

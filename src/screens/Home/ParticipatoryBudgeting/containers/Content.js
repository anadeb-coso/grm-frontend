import React from "react";
import { View, FlatList, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Divider, Text } from "react-native-paper";
import moment from "moment";
import "moment/locale/fr";
import { FontAwesome5 } from "@expo/vector-icons";
import { styles } from "./Content.styles";
import { colors } from "../../../../utils/colors";

moment.locale("fr");

function Content({ eadl }) {
  const navigation = useNavigation();
  const goToPhase = (phase) =>
    navigation.navigate("PhaseTasks", {
      eadl,
      phase,
    });
  return (
    <FlatList
      data={eadl?.phases || []}
      contentContainerStyle={{ padding: 21 }}
      keyExtractor={(item, index) => index.toString()}
      ItemSeparatorComponent={() => <Divider style={{ marginVertical: 10 }} />}
      renderItem={({ item }) => {
        const completedTasks = item.tasks.filter(
          ({ status }) => status === "completed"
        ).length;
        return (
          <TouchableOpacity
            onPress={() => goToPhase(item)}
            style={styles.cardContainer}
          >
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: "row" }}>
                <View style={styles.cardIdContainer}>
                  <Text style={styles.cardIdText}>{item.ordinal}</Text>
                </View>
                <View>
                  <Text numberOfLines={1} style={styles.cardNameText}>
                    {item.title}
                  </Text>
                </View>
              </View>
              {item.title !== "Suivi et l'Evaluation (SEP)" && (
                <View
                  style={[
                    styles.cardCompletionContainer,
                    {
                      backgroundColor:
                        completedTasks === 0
                          ? colors.disabled
                          : completedTasks === item.tasks.length
                          ? colors.primary
                          : colors.inProgress,
                    },
                  ]}
                >
                  <Text style={styles.cardCompletionText}>
                    {completedTasks}/{item.tasks.length}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.cardFooter}>
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
              <View>
                <FontAwesome5
                  name="chevron-circle-right"
                  size={12}
                  color="#24c38b"
                />
              </View>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

export default Content;

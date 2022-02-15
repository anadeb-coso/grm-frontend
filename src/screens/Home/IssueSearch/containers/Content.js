import React, { useState } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  StatusBar,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../../../utils/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import i18n from "i18n-js";

function Content({ issues, eadl }) {
  const navigation = useNavigation();
  const [selectedId, setSelectedId] = useState(null);

  const Item = ({ item, onPress, backgroundColor, textColor }) => (
    <TouchableOpacity onPress={onPress} style={[styles.item]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={[styles.title]}>{item.tracking_code}</Text>
        <Text style={[styles.title, { flexShrink: 1, marginHorizontal: 20 }]}>
          {item.title}
        </Text>
        <MaterialCommunityIcons
          name="chevron-right-circle"
          size={24}
          color={colors.primary}
        />
      </View>
      {/*<Text style={[styles.title]}>{item.description}</Text>*/}
    </TouchableOpacity>
  );

  const renderItem = ({ item }) => {
    const backgroundColor = item.id === selectedId ? "#6e3b6e" : "#f9c2ff";
    const color = item.id === selectedId ? "white" : "black";

    return (
      <Item
        item={item}
        onPress={() =>
            navigation.navigate('IssueDetailTabs', {
            item,
        })
        }
        backgroundColor={{ backgroundColor }}
        textColor={{ color }}
      />
    );
  };

  const renderHeader = () => {
    return (
      <View>
        <View
          style={{
            borderRadius: 10,
            backgroundColor: "#ffffff",
            shadowColor: "rgba(0, 0, 0, 0.05)",
            shadowOffset: {
              width: 0,
              height: 3,
            },
            shadowRadius: 15,
            shadowOpacity: 1,
            margin: 23,
            padding: 15,
          }}
        >
          <Text
            style={{
              fontFamily: "Poppins_700Bold",
              fontSize: 14,
              fontWeight: "bold",
              fontStyle: "normal",
              letterSpacing: 0,
              textAlign: "left",
              color: "#707070",
            }}
          >
            {i18n.t("overdue_label")}:{" "}
            {issues.overdue ? (
              <Text style={{ color: "#ef6a78" }}>{issues.overdue}</Text>
            ) : (
              "--"
            )}
          </Text>
          <Text style={styles.statisticsText}>
            {i18n.t("assigned_to_you_label")}: {issues.length}
          </Text>
          <Text style={styles.statisticsText}>
            {i18n.t("resolved_by_you_label")}:{" "}
            {issues.average ? <Text style>issues.average</Text> : "--"}
          </Text>
          <Text style={styles.statisticsText}>
            {i18n.t("average_days_label")}:{" "}
            {issues.average ? <Text style>issues.average</Text> : "--"}
          </Text>
          <Text style={styles.statisticsText}>
            {i18n.t("average_satisfaction_label")}:{" "}
            {issues.average ? <Text style>issues.average</Text> : "--"}
          </Text>
        </View>
        <View style={{ padding: 15 }}>
          <Text
            style={{
              fontSize: 17,
              fontWeight: "bold",
              fontStyle: "normal",
              lineHeight: 18,
              letterSpacing: 0,
              textAlign: "left",
              color: "#707070",
            }}
          >
            {i18n.t("your_issues_label")}:
          </Text>
        </View>
      </View>
    );
  };
  return (
    <FlatList
      style={{ flex: 1 }}
      data={issues}
      renderItem={renderItem}
      ListHeaderComponent={renderHeader}
      keyExtractor={(item) => item.id}
      extraData={selectedId}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: StatusBar.currentHeight || 0,
  },
  item: {
    flex: 1,
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 23,
    borderBottomWidth: 1,
    borderColor: "#f6f6f6",
  },
  title: {
    fontFamily: "Poppins_400Regular",
    // fontSize: 12,
    fontWeight: "normal",
    fontStyle: "normal",
    // lineHeight: 10,
    letterSpacing: 0,
    // textAlign: "left",
    color: "#707070",
  },
  statisticsText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 11,
    fontWeight: "bold",
    fontStyle: "normal",
    letterSpacing: 0,
    textAlign: "left",
    color: "#707070",
  },
});

export default Content;

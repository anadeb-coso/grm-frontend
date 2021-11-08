import React from "react";
import { SafeAreaView, FlatList, Text, View } from "react-native";
import { styles } from "../Notifications/components/NotificationItem/NotificationItem.style";
import Svg, { Circle } from "react-native-svg";
import { Divider } from "react-native-paper";

const BudgetLog = ({ route }) => {
  const { project } = route?.params;
  const ListItem = ({ description, timestamp, formattedAmount }) => {
    return (
      <>
        <View style={styles.itemContainer}>
          {(true && (
            <Svg height="50%" width="10%" viewBox="0 0 100 100">
              <Circle cx="50" cy="50" r="12" fill="#24c38b" />
            </Svg>
          )) || <View style={{ width: "10%" }} />}
          <View style={{ flex: 1 }}>
            <Text style={[styles.notificationTitle]}>{description}</Text>
            <Text style={[styles.notificationTitle]}>
              Amount: {formattedAmount}
            </Text>
            <Text style={[styles.notificationTitle]}>
              {JSON.stringify(timestamp)}
            </Text>
          </View>
        </View>
        <Divider style={{ marginHorizontal: "5%" }} />
      </>
    );
  };
  return (
    <SafeAreaView>
      {project && (
        <FlatList
          data={project.budget_allocated}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => <ListItem {...item} />}
        />
      )}
    </SafeAreaView>
  );
};

export default BudgetLog;

import React, { useEffect, useState } from "react";
import { SafeAreaView, FlatList, Text, View } from "react-native";
import { styles } from "../Notifications/components/NotificationItem/NotificationItem.style";
import Svg, { Circle } from "react-native-svg";
import { Divider } from "react-native-paper";
import { database } from "../../../database";

const BudgetLog = ({ route }) => {
  const { bpProjectId } = route?.params;
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    if (!bpProjectId) return;
    (async () => {
      const record = await database.get('bp_projects').find(bpProjectId);
      const allocations = await record.budgetAllocations.fetch();
      setEntries(allocations.map((a) => ({
        description: a.description,
        timestamp: a.entryDate,
        formattedAmount: new Intl.NumberFormat().format(a.amount),
      })));
    })();
  }, [bpProjectId]);

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
      <FlatList
        data={entries}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => <ListItem {...item} />}
      />
    </SafeAreaView>
  );
};

export default BudgetLog;

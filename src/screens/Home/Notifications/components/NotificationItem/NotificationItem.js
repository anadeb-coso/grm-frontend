import React from "react";
import { View } from "react-native";
import { Divider, Text } from "react-native-paper";
import Svg, { Circle } from "react-native-svg";
import { styles } from "./NotificationItem.style";

const NotificationItem = ({ title, isRead }) => {
  return (
    <>
      <View style={styles.itemContainer}>
        {(isRead && (
          <Svg height="50%" width="10%" viewBox="0 0 100 100">
            <Circle cx="50" cy="50" r="12" fill="#24c38b" />
          </Svg>
        )) || <View style={{ width: "10%" }} />}
        <View style={{ flex: 1 }}>
          <Text style={[styles.notificationTitle]}>{title}</Text>
        </View>
      </View>
      <Divider style={{ marginHorizontal: "5%" }} />
    </>
  );
};

export default NotificationItem;

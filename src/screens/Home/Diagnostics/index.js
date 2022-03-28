import React from "react";
import { StyleSheet, SafeAreaView, View } from "react-native";
import { Text } from "react-native-paper";
import { colors } from "../../../utils/colors";

export function Diagnostics() {
  const styles = StyleSheet.create({
    form: { flex: 1, justifyContent: "center", alignItems: "center" },
    input: {
      marginBottom: 10,
    },
  });

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.form}>
        <Text style={{ color: colors.primary, fontWeight: "bold" }}>
          Upcoming feature.
        </Text>
      </View>
    </SafeAreaView>
  );
}

export default Diagnostics;

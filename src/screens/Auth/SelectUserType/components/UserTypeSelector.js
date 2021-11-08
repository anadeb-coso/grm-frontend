import React from "react";
import { StyleSheet, View, TouchableOpacity, Text } from "react-native";
import EADLMan from "../../../../../assets/eADL_man.svg";
import EADLWoman from "../../../../../assets/eADL_woman.svg";
import GreenCheck from "../../../../../assets/green_check.svg";
import { shadow } from "../../../../utils/globalStyles";

function UserTypeSelector({ selectUser, userType }) {
  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity
        style={[
          styles.buttonContainer,
          { borderColor: userType === 1 ? "green" : "white" },
        ]}
        onPress={() => selectUser(1)}
      >
        <EADLMan height={200} style={{ alignSelf: "center" }} />

        <View style={styles.titleContainer}>
          <Text style={styles.title}>ADL</Text>
          {userType === 1 && <GreenCheck />}
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.buttonContainer,
          { borderColor: userType === 2 ? "green" : "white" },
        ]}
        onPress={() => selectUser(2)}
      >
        <EADLWoman height={200} style={{ alignSelf: "center" }} />

        <View style={styles.titleContainer}>
          <Text style={styles.title}>LG</Text>
          {userType === 2 && <GreenCheck />}
        </View>
      </TouchableOpacity>
    </View>
  );
}

export default UserTypeSelector;

const styles = StyleSheet.create({
  surface: {
    padding: 8,
    height: 80,
    marginHorizontal: 10,
    width: 80,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  buttonContainer: {
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 21,
    backgroundColor: "white",
    ...shadow,
  },
  titleContainer: {
    flex: 1,
    flexDirection: "row",
    position: "absolute",
    top: 24,
    paddingHorizontal: 24,
    justifyContent: "space-between",
    width: "100%",
  },
  title: {
    width: 62,
    height: 45,
    fontFamily: "Poppins_700Bold",
    fontSize: 32,
    fontWeight: "bold",
    fontStyle: "normal",
    lineHeight: 39,
    letterSpacing: 0,
    textAlign: "left",
    color: "#707070",
  },
});

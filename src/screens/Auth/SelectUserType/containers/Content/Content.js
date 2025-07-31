import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Button, Title } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import UserTypeSelector from "../../components/UserTypeSelector";

const Content = () => {
  const navigation = useNavigation();
  const [userType, setUserType] = useState();
  const selectUser = (type) => {
    setUserType(type);
  };

  return (
    <View style={styles.content}>
      <Title
        style={{
          fontFamily: "Poppins_500Medium",
          fontSize: 19,
          fontWeight: "bold",
          fontStyle: "normal",
          lineHeight: 23,
          letterSpacing: 0,
          textAlign: "center",
          color: "#707070",
        }}
      >
        {"Quel type d’utilisateur\n êtes vous?"}
      </Title>
      <View style={{ flexDirection: "row", padding: 30 }}>
        <UserTypeSelector selectUser={selectUser} userType={userType} />
      </View>
      <Button
        style={{
          backgroundColor: !userType ? "lightgray" : "#24c38b",
          borderRadius: 10,
        }}
        mode="contained"
        disabled={!userType}
        onPress={
          !userType
            ? {}
            : () => {
                navigation.navigate("SignUp", { userType: userType });
              }
        }
      >
        SUIVANT
      </Button>
    </View>
  );
};

export default Content;

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: "space-evenly",
    alignItems: "center",
  },
});

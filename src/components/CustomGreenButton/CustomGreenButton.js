import React from "react";
import { TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";

const CustomGreenButton = ({ children, buttonStyle, textStyle, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        {
          width: 73,
          height: 16,
          borderRadius: 18,
          backgroundColor: "#24c38b",
          justifyContent: "center",
          alignItems: "center",
        },
        buttonStyle,
      ]}
    >
      <Text
        style={[
          {
            fontFamily: "Poppins_700Bold",
            fontSize: 7,
            fontWeight: "bold",
            fontStyle: "normal",
            lineHeight: 10,
            letterSpacing: 0,
            textAlign: "left",
            color: "#ffffff",
          },
          textStyle,
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
};

export default CustomGreenButton;

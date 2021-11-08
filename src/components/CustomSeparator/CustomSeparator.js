import React from "react";
import { View } from "react-native";

const CustomSeparator = ({ customStyle }) => {
  return (
    <View
      style={{
        ...customStyle,
        flex: 1,
        height: 0.1,
        borderStyle: "solid",
        borderWidth: 0.5,
        borderColor: "#f6f6f6",
        marginVertical: 23,
      }}
    />
  );
};

export default CustomSeparator;

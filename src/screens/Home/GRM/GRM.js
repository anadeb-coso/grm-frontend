import React from "react";
import { SafeAreaView } from "react-native";
import Content from "./containers";
import { styles } from "./GRM.style";

const GRM = () => {
  const customStyles = styles();
  return (
    <SafeAreaView style={customStyles.container}>
      <Content />
    </SafeAreaView>
  );
};

export default GRM;

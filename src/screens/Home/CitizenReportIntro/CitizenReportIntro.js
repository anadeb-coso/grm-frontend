import React from "react";
import { SafeAreaView } from "react-native";
import Content from "./containers/Content";
import { styles } from "./CitizenReportIntro.styles";

const CitizenReportIntro = () => {
  const customStyles = styles();

  return (
    <SafeAreaView style={customStyles.container}>
      <Content />
    </SafeAreaView>
  );
};

export default CitizenReportIntro;

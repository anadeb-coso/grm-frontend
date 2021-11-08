import React from "react";
import { SafeAreaView } from "react-native";
import Content from "./containers/Content";
import { styles } from "./CitizenReportStep4.styles";

const CitizenReportStep4 = ({ route }) => {
  const { params } = route;
  const customStyles = styles();

  return (
    <SafeAreaView style={customStyles.container}>
      <Content issue={params.issue} />
    </SafeAreaView>
  );
};

export default CitizenReportStep4;

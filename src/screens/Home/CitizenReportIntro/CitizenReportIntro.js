import React from "react";
import { SafeAreaView } from "react-native";
import Content from "./containers/Content";
import { styles } from "./CitizenReportIntro.styles";
import SnackBarCheckFileUnsyncComponent from '../../../components/SnackBarCheckFileUnsyncComponent/SnackBarCheckFileUnsyncComponent';

const CitizenReportIntro = () => {
  const customStyles = styles();

  return (
    <SafeAreaView style={customStyles.container}>
      <Content />

      <SnackBarCheckFileUnsyncComponent />

    </SafeAreaView>
  );
};

export default CitizenReportIntro;

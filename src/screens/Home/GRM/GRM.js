import React from "react";
import { SafeAreaView } from "react-native";
import Content from "./containers";
import { styles } from "./GRM.style";
import SnackBarCheckAppVersionComponent from "../../../components/SnackBarCheckAppVersionComponent/SnackBarCheckAppVersionComponent";
import SnackBarCheckFileUnsyncComponent from "../../../components/SnackBarCheckFileUnsyncComponent/SnackBarCheckFileUnsyncComponent";

const GRM = () => {
  const customStyles = styles();
  return (
    <SafeAreaView style={customStyles.container}>
      <Content />

      <SnackBarCheckFileUnsyncComponent />
      <SnackBarCheckAppVersionComponent />
    </SafeAreaView>
  );
};

export default GRM;

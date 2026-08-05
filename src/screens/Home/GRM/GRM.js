import React from "react";
import { SafeAreaView } from "react-native";
import Content from "./containers";
import { styles } from "./GRM.style";
import SnackBarCheckAppVersionComponent from "../../../components/SnackBarCheckAppVersionComponent/SnackBarCheckAppVersionComponent";
import SnackBarCheckFileUnsyncComponent from "../../../components/SnackBarCheckFileUnsyncComponent/SnackBarCheckFileUnsyncComponent";
import AppPermissionsRequestComponent from "../../../components/AppPermissionsRequestComponent/AppPermissionsRequestComponent";
// import SyncStatusBar from "../../../components/SyncStatus/SyncStatusBar";

const GRM = () => {
  const customStyles = styles();
  return (
    <SafeAreaView style={customStyles.container}>
      {/* <SyncStatusBar /> */}
      <Content />

      <SnackBarCheckFileUnsyncComponent />
      <SnackBarCheckAppVersionComponent />
      <AppPermissionsRequestComponent />
    </SafeAreaView>
  );
};

export default GRM;

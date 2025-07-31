import React from "react";
import { SafeAreaView } from "react-native";
import Content from "./containers/Content";
import { styles } from "./IssueDetail.styles";
import SnackBarCheckFileUnsyncComponent from "../../../components/SnackBarCheckFileUnsyncComponent/SnackBarCheckFileUnsyncComponent";

const IssueDetail = ({ route }) => {
  const { params } = route;
  const customStyles = styles();

  return (
    <SafeAreaView style={customStyles.container}>
      <Content issue={params.item} />

      
      <SnackBarCheckFileUnsyncComponent />
    </SafeAreaView>
  );
};

export default IssueDetail;

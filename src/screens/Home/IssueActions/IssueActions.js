import React from "react";
import { SafeAreaView } from "react-native";
import Content from "./containers/Content";
import { styles } from "./IssueActions.styles";

const IssueActions = () => {
  const customStyles = styles();

  return (
    <SafeAreaView style={customStyles.container}>
      <Content />
    </SafeAreaView>
  );
};

export default IssueActions;

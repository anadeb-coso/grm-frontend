import React from "react";
import { SafeAreaView } from "react-native";
import Content from "./containers/Content";
import { styles } from "./IssueActions.styles";

const IssueActions = ({ route, navigation }) => {
    const { params } = route;
    const customStyles = styles();

  return (
    <SafeAreaView style={customStyles.container}>
      <Content issue={params.item} navigation={navigation} />
    </SafeAreaView>
  );
};

export default IssueActions;

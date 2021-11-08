import React from "react";
import { SafeAreaView } from "react-native";
import Content from "./containers/Content";
import { styles } from "./PhaseTasks.styles";
import { useRoute } from "@react-navigation/native";

const PhaseTasks = () => {
  const customStyles = styles();
  const { params } = useRoute();
  return (
    <SafeAreaView style={customStyles.container}>
      <Content eadl={params.eadl} phase={params.phase} />
    </SafeAreaView>
  );
};

export default PhaseTasks;

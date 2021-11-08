import React from "react";
import { SafeAreaView } from "react-native";
import Content from "./containers/Content";
import { styles } from "./DocumentTask.styles";
import { useRoute } from "@react-navigation/native";

const DocumentTask = () => {
  const { params } = useRoute();
  const customStyles = styles();
  return (
    <SafeAreaView style={customStyles.container}>
      <Content
        task={params.task}
        phase={params.phase}
        eadl={params.eadl}
        updatePhase={params.update}
      />
    </SafeAreaView>
  );
};

export default DocumentTask;

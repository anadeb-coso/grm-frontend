import React from "react";
import { SafeAreaView } from "react-native";
import Content from "./containers/Content";
const Onboarding = () => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF", padding: 30 }}>
      <Content />
    </SafeAreaView>
  );
};

export default Onboarding;

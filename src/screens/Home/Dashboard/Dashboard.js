import React, { useEffect } from "react";
import { SafeAreaView } from "react-native";
import Content from "./containers";
import { styles } from "./Dashboard.style";
import * as Location from "expo-location";

const Dashboard = () => {
  const customStyles = styles();

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }
    })();
  }, []);

  return (
    <SafeAreaView style={customStyles.container}>
      <Content />
    </SafeAreaView>
  );
};

export default Dashboard;

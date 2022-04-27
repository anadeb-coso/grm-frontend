import React from "react";
import { SafeAreaView, Text } from "react-native";
import { Button } from "react-native-paper";
import { logout } from "../../../store/ducks/authentication.duck";
import { useDispatch } from "react-redux";
import i18n from 'i18n-js';

export function WorkInProgress() {
  const dispatch = useDispatch();
  return (
    <SafeAreaView
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <Text>Work in Progress </Text>
      <Button color={"#24c38b"} onPress={() => dispatch(logout())}>
        {i18n.t('logout')}
      </Button>
    </SafeAreaView>
  );
}

export default WorkInProgress;

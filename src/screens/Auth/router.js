import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import SelectUserType from "./SelectUserType";
import Login from "./Login/Login";
import SignUp from "./SignUp";
import { colors } from "../../utils/colors";
const Stack = createStackNavigator();
const defaultHeaderOptions = {
  title: "",
  headerTintColor: colors.primary,
  headerStyle: { shadowColor: "transparent", elevation: 0 },
};
const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="SelectUserType"
        component={SelectUserType}
        options={defaultHeaderOptions}
      />
      <Stack.Screen
        name="Login"
        component={Login}
        options={defaultHeaderOptions}
      />
      <Stack.Screen
        name="SignUp"
        component={SignUp}
        options={defaultHeaderOptions}
      />
    </Stack.Navigator>
  );
};

export default AuthStack;

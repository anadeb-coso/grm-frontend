import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import HomeRouter from "../screens/Home/";
const Stack = createStackNavigator();
const PrivateRoutes = () => {
  return (
    <Stack.Navigator>
      {/* //* Home */}
      <Stack.Screen
        options={{
          headerShown: false,
        }}
        name="Main"
        component={HomeRouter}
      />
      {/* /* Along with these would come any other route that wouldn't fit inside
      the bottom tab navigator, meaning any view which doesn't display the tabs
      at the bottom of the screen. */}
    </Stack.Navigator>
  );
};

export default PrivateRoutes;

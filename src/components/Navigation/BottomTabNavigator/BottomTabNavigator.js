import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
// import { useTheme } from 'react-native-paper';
import { Transition } from "react-native-pose";
import { styles } from "./BottomTabNavigator.style";
const Tab = createBottomTabNavigator();

// const Label = posed.Text({
//   enter: { opacity: 1, x: 0 },
//   exit: { opacity: 0, x: 30, transition: { duration: 0 } },
// });
const NavigationDrawerNavigator = ({ children }) => {
  //   const theme = useTheme();
  return (
    <Tab.Navigator
      initialRouteName={"Dashboard"}
      screenOptions={({ route }) => ({
        tabBarLabel: ({ focused }) => {
          // let label =
          //   route.name.length > 5
          //     ? `${route.name.substring(0, 3)}...`
          //     : route.name;
          return (
            <Transition>
              {/*{focused && (*/}
              {/*  <Label*/}
              {/*    key={route.name}*/}
              {/*    style={styles.label}*/}
              {/*  >{`${label.toUpperCase()}`}</Label>*/}
              {/*)}*/}
            </Transition>
          );
        },
      })}
      tabBarOptions={{
        labelPosition: "beside-icon",
        inactiveTintColor: "black", //theme.primary,
        activeTintColor: "#009460", //theme.primary,
        // activeBackgroundColor: "#6639bf", // theme.primary,
        tabStyle: {
          ...styles.tabItemStyle,
        },
        style: {
          ...styles.tabComponentStyle,
        },
        labelStyle: {
          ...styles.labelStyle,
        },
      }}
    >
      {children}
    </Tab.Navigator>
  );
};
export default NavigationDrawerNavigator;

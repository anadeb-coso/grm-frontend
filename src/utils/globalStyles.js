import { StyleSheet, Platform, Dimensions } from "react-native";
import { getStatusBarHeight } from "react-native-iphone-x-helper";

export const screenHeight = Dimensions.get("window").height;
export const shadow = {
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.23,
  shadowRadius: 2.62,

  elevation: 4,
};

const shadowless = {
  shadowColor: "transparent",
  shadowOffset: {
    width: 0,
    height: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  elevation: 0,
};
const headerTitle = {
  color: "rgba(255,255,255,0.87)",
  fontSize: 12,
  letterSpacing: 2,
  lineHeight: 16,
  textAlign: "center",
  textTransform: "uppercase",
};

export default StyleSheet.create({
  shadowless,
  marginRight20: {
    marginRight: 20,
  },
  headerTitle,
  blueHeader: {
    ...shadowless,
    backgroundColor: "#142695",
  },
  tabHeader: {
    ...shadowless,
    backgroundColor: "#36429f",
    borderBottomColor: "rgba(255,255,255,.1)",
    borderBottomWidth: 1,
    height: 60 + getStatusBarHeight(true),
  },
  menuSectionHeaderStyle: {
    backgroundColor: "#142695",
    shadowColor: "#142695",
    elevation: 0,
  },
  headerTitleWithRight: {
    ...headerTitle,
    marginRight: Platform.OS === "android" ? 50 : undefined,
  },
});

import { StyleSheet } from "react-native";
import {colors} from "../../../../utils/colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20
  },
  commentCard: {
    marginVertical: 5,
    marginHorizontal: 10
  },
  title: {
    fontFamily: "Poppins_700Bold",
    marginVertical: 5,
    fontSize: 16,
    fontWeight: "bold",
    fontStyle: "normal",
    letterSpacing: 0,
    color: "#707070",
  },
  greenCircle: {
    backgroundColor: colors.primary,
    height: 20,
    width: 20,
    borderRadius: 10,
    marginRight: 10
  },
  subtitle: {
    fontFamily: "Poppins_700Bold",
    letterSpacing: 0,
    textAlign: "left",
    color: "#707070",
  },
  stepText: {
    marginVertical: 5,
    fontSize: 29,
    fontWeight: "bold",
    fontStyle: "normal",
    letterSpacing: 0,
    color: "#24c38b",
  },
  stepDescription: {
    fontFamily: "Poppins_700Bold",
    marginVertical: 5,
    fontSize: 17,
    fontWeight: "bold",
    fontStyle: "normal",
    lineHeight: 18,
    letterSpacing: 0,
    textAlign: "left",
    color: "#707070",
  },
  stepNote: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    fontWeight: "normal",
    fontStyle: "normal",
    lineHeight: 14,
    letterSpacing: 0,
    textAlign: "left",
    color: "#707070",
  },
  radioLabel: {
    fontFamily: "Poppins_400Regular",
    fontWeight: "normal",
    fontStyle: "normal",
    lineHeight: 18,
    letterSpacing: 0,
    textAlign: "left",
    color: "#707070",
  },
  grmInput: {
    height: 40,
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    fontWeight: "normal",
    fontStyle: "normal",
    lineHeight: 18,
    letterSpacing: 0,
    textAlign: "left",
    color: "#707070",
  },

  // dropdown
  dropdownWrapper: {
    marginHorizontal: 50,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    fontWeight: "normal",
    fontStyle: "normal",
    lineHeight: 18,
    letterSpacing: 0,
    textAlign: "left",
    color: "#707070",
  },
  dropdownLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    fontWeight: "normal",
    fontStyle: "normal",
    lineHeight: 18,
    letterSpacing: 0,
    textAlign: "left",
    color: "#707070",
  },
  dropdownContainer: {
    borderColor: "#dedede",
    elevation: 3,
  },
  dropdownStyle: {
    borderColor: "#dedede",
    elevation: 3,
  },
});

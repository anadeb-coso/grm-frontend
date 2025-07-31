const { StyleSheet } = require("react-native");

export const styles = StyleSheet.create({
  label: {
    color: "white",
    fontWeight: "100",
    right: 25,
    fontSize: 10,
    letterSpacing: 1.5,
    position: "absolute",
  },
  tabItemStyle: {
    flex: 1,
    borderRadius: 25, //theme.roundness,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
  },
  tabComponentStyle: {
    backgroundColor: "white",
    height: 70,
    paddingVertical: 13,
    paddingHorizontal: 20,
  },
  labelStyle: {
    color: "white",
  },
});

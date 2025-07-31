const { StyleSheet } = require("react-native");

export const styles = (colors) =>
  StyleSheet.create({
    content: {
      flex: 1,
    },
    imageView: {
      flex: 0.65,
      width: "100%",
      marginVertical: 30,
      justifyContent: "center",
      alignItems: "center",
    },
    arrowButton: {
      borderRadius: 40,
    },
    arrowContent: {
      height: 73,
      width: 73,
      left: 7,
    },
    buttonsView: {
      flexDirection: "column",
      flex: 0.4,
      width: "100%",
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
    },
    upperTitle: {
      // color: `${colors.titles}`,
      fontSize: 12,
      textAlign: "center",
      textTransform: "uppercase",
      paddingTop: 5,
      letterSpacing: 3,
      marginBottom: 40,
    },
    title: {
      textAlign: "center",
      fontSize: 34,
      // flex: 0.15,
      lineHeight: 36,
      width: 300,
      // color: `${colors.titles}`,
      alignSelf: "center",
      alignContent: "flex-end",
      marginBottom: 15,
    },
    subtitle: {
      width: "60%",
      textAlign: "center",
      alignSelf: "center",
      marginBottom: 20,
      lineHeight: 22,
      fontSize: 16,
      letterSpacing: 0.5,
    },

    skipButton: {
      position: "absolute",
      right: 0,
      top: "35%",
    },
    skipButtonLabel: {
      color: "black",
      letterSpacing: 3,
    },
  });

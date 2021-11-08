const { StyleSheet } = require("react-native");

export const styles = (colors) =>
  StyleSheet.create({
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "space-around",
      paddingBottom: 50,
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
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      // flex: 1,
    },
    button: {
      marginHorizontal: 10,
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
      marginBottom: 15,
      fontFamily: "Poppins_400Regular",
      fontSize: 19,
      fontWeight: "bold",
      fontStyle: "normal",
      lineHeight: 23,
      letterSpacing: 0,
      textAlign: "center",
      color: "#707070",
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

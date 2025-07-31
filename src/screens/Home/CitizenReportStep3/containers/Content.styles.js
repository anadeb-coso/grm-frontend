import { StyleSheet, Dimensions } from 'react-native';

const screenHeight = Dimensions.get('window').height;

export const styles = StyleSheet.create({
  title: {
    fontFamily: "Poppins_700Bold",
    marginVertical: 5,
    fontSize: 16,
    fontWeight: "bold",
    fontStyle: "normal",
    letterSpacing: 0,
    color: "#24c38b",
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    fontWeight: "normal",
    fontStyle: "normal",
    lineHeight: 14,
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
  stepSubtitle: {
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
  stepDescription: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    fontWeight: "normal",
    fontStyle: "normal",
    lineHeight: 15,
    letterSpacing: 0,
    textAlign: "left",
    color: "#707070",
  },
  stepNote: {
    fontFamily: "Poppins_400Regular",
    marginVertical: 5,
    fontSize: 10,
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
    // height: 40,
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    letterSpacing: 0,
    // textAlign: "left",
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


  conatinerFieldsPlanning: {
    padding: 15,
    marginBottom: 137//'37%'
  },
   modalView: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 13,
    // alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
   modalViewPlanning: {
    // height: '95%',
    // marginTop: '10%'
    height: screenHeight - 55,
    marginTop: 55
  },
  modalHeader: {
    flexDirection: 'row',
  },
  containerModalText: {
    flex: 0.7
  },
  modalDetailText: {
    textAlign: 'left',
    fontWeight: 'bold',
    fontSize: 17
  },
  containerModalHeaderIcon: {
    flex: 0.3,
    alignItems: 'flex-end',
    top: 0
  },

});

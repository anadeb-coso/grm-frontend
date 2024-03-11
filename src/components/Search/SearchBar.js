import React from "react";
import { StyleSheet, TextInput, View, Keyboard, TouchableOpacity, Text } from "react-native";
import { Feather, Entypo } from "@expo/vector-icons";
import { useTranslation } from 'react-i18next';

const SearchBar = ({clicked, searchPhrase, setSearchPhrase, setClicked, onChangeFunction}) => {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <View
        style={styles.searchBar__clicked}
        //   clicked
        //     ? styles.searchBar__clicked
        //     : styles.searchBar__unclicked
        // }
      >
        {/* search Icon */}
        <Feather
          name="search"
          size={17}
          color="black"
          style={{ marginLeft: 1 }}
        />
        {/* Input field */}
        <TextInput
          style={styles.input}
          placeholder={t('search_label')}
          value={searchPhrase}
          onChangeText={(value) => {
            setSearchPhrase(value);
            onChangeFunction(value);
          }}
          onFocus={() => {
            setClicked(true);
          }}
        />
        {/* cross Icon, depending on whether the search bar is clicked or not */}
        {clicked && (
          <Entypo name="cross" size={20} color="black" style={{ padding: 1 }} onPress={() => {
              setSearchPhrase("");
              onChangeFunction("");
          }}/>
        )}
      </View>
      {/* cancel button, depending on whether the search bar is clicked or not */}
      {/* {clicked && (
        <View>
          <TouchableOpacity
              onPress={() => {
                Keyboard.dismiss();
                setClicked(false);
              }}
              style={{ flexDirection: 'row', justifyContent: 'center' }}
            >
              <Box
                py={3}
                px={4}
                bg={"#24c38b"}
                style={{ backgroundColor: "#24c38b" }}
                rounded="xl"
                borderWidth={1}
                borderColor={"yellow.500"}
                justifyContent="center"
                alignItems="center"
              >
                <Text fontWeight="bold" fontSize="xs" color="white">Annuler</Text>
              </Box>
            </TouchableOpacity>

        </View>
      )} */}
    </View>
  );
};
export default SearchBar;

// styles
const styles = StyleSheet.create({
  container: {
    // margin: 15,
    marginTop: 5,
    justifyContent: "flex-start",
    alignItems: "center",
    flexDirection: "row",
    width: "90%",

  },
  searchBar__unclicked: {
    padding: 10,
    flexDirection: "row",
    width: "95%",
    backgroundColor: "#d9dbda",
    borderRadius: 15,
    alignItems: "center",
  },
  searchBar__clicked: {
    padding: 10,
    flexDirection: "row",
    // width: "80%",
    width: "100%",
    backgroundColor: "#d9dbda",
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  input: {
    fontSize: 20,
    marginLeft: 10,
    width: "90%",
  },
});
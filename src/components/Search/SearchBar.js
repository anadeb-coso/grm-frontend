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
          size={16}
          color="#8a97a3"
          style={{ marginLeft: 2 }}
        />
        {/* Input field */}
        <TextInput
          style={styles.input}
          placeholder={t('search_label')}
          placeholderTextColor="#9aa5af"
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
          <Entypo name="cross" size={18} color="#8a97a3" style={{ padding: 1 }} onPress={() => {
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
    justifyContent: "flex-start",
    alignItems: "center",
    flexDirection: "row",
    width: "100%",
  },
  searchBar__unclicked: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    flexDirection: "row",
    width: "100%",
    backgroundColor: "#f2f5f6",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e6ebee",
    alignItems: "center",
  },
  searchBar__clicked: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    flexDirection: "row",
    width: "100%",
    backgroundColor: "#f2f5f6",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e6ebee",
    alignItems: "center",
    justifyContent: "space-between",
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#2f3a45",
    marginLeft: 10,
    padding: 0,
  },
});
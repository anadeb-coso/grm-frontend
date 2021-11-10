import React, { useState } from "react";
import { styles } from "./CustomDropDownPicker.style";
import DropDownPicker from "react-native-dropdown-picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../utils/colors";
import { Dimensions, View } from "react-native";

const screenHeight = Dimensions.get("window").height;

const CustomDropDownPicker = ({
  value,
  items,
  listMode="SCROLLVIEW",
  scrollViewProps={
    nestedScrollEnabled: true
  },
  setPickerValue,
  setItems,
  placeholder,
  onChangeValue,
  schema,
  zIndex=100,
  customDropdownWrapperStyle,
  disabled = false,
  onOpen = () => null,
  onClose = () => null,
}) => {
  const [dropdownVisible, setDropdownVisible] = React.useState(false);
  const [open, setOpen] = useState(false);
  return (
    <View
      style={[
        styles.dropdownWrapper,
        { minHeight: screenHeight * (dropdownVisible ? 0.40 : 0), zIndex },
        customDropdownWrapperStyle,
      ]}
    >
      <DropDownPicker
          zIndex={zIndex}
        schema={schema}
        disabled={disabled}
        onOpen={() => {
          onOpen();
          setDropdownVisible(true);
        }}
        onClose={() => {
          onClose();
          setDropdownVisible(false);
        }}
        ArrowUpIconComponent={({ style }) => (
          <MaterialCommunityIcons
            name="chevron-up-circle"
            size={24}
            color={colors.primary}
          />
        )}
        ArrowDownIconComponent={({ style }) => (
          <MaterialCommunityIcons
            name="chevron-down-circle"
            size={24}
            color={colors.primary}
          />
        )}
        style={styles.dropdownStyle}
        dropDownContainerStyle={styles.dropdownContainer}
        textStyle={styles.dropdownText}
        labelStyle={styles.dropdownLabel}
        itemSeparator={true}
        onChangeValue={onChangeValue}
        itemSeparatorStyle={{
          backgroundColor: "#f6f6f6",
        }}
        placeholder={placeholder}
        open={open}
        value={value}
        items={items}
        setOpen={setOpen}
        setValue={(newValue) => setPickerValue(newValue)}
        setItems={(newItems) => setItems(newItems)}
        listMode={listMode}
        scrollViewProps={scrollViewProps}
      />
    </View>
  );
};

export default CustomDropDownPicker;

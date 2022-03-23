import React, { useState } from 'react';
import DropDownPicker from 'react-native-dropdown-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Dimensions, Platform, View } from 'react-native';
import { colors } from '../../utils/colors';
import { styles } from './CustomDropDownPicker.style';

const screenHeight = Dimensions.get('window').height;

function CustomDropDownPicker({
  value,
  items,
  listMode = 'SCROLLVIEW',
  scrollViewProps = {
    nestedScrollEnabled: true,
  },
  setPickerValue,
  setItems,
  placeholder,
  onChangeValue,
  schema,
  zIndex = 100,
  zIndexInverse = 100,
  customDropdownWrapperStyle,
  disabled = false,
  onOpen = () => null,
  onClose = () => null,
  onSelectItem = () => null,
}) {
  const [dropdownVisible, setDropdownVisible] = React.useState(false);
  const [open, setOpen] = useState(false);
  return (
    <View
      style={[
        styles.dropdownWrapper,
        { minHeight: screenHeight * (dropdownVisible ? 0.4 : 0), zIndex },
        customDropdownWrapperStyle,
        Platform.OS === 'ios' ? { zIndex: dropdownVisible ? 1 : 0 } : {},
        Platform.OS === 'android' ? { elevation: dropdownVisible ? 10 : 0 } : {},
      ]}
    >
      <DropDownPicker
        zIndex={zIndex}
        dropDownDirection="BOTTOM"
        zIndexInverse={zIndexInverse}
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
          <MaterialCommunityIcons name="chevron-up-circle" size={24} color={colors.primary} />
        )}
        ArrowDownIconComponent={({ style }) => (
          <MaterialCommunityIcons name="chevron-down-circle" size={24} color={colors.primary} />
        )}
        onSelectItem={(item) => onSelectItem(item)}
        style={styles.dropdownStyle}
        dropDownContainerStyle={styles.dropdownContainer}
        textStyle={styles.dropdownText}
        labelStyle={styles.dropdownLabel}
        itemSeparator
        onChangeValue={onChangeValue}
        itemSeparatorStyle={{
          backgroundColor: '#f6f6f6',
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
}

export default CustomDropDownPicker;

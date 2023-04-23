/* eslint-disable react/no-unstable-nested-components */
import { FontAwesome5 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import React from 'react';
import { View } from 'react-native';
import CustomDropDownPicker from '../components/CustomDropDownPicker/CustomDropDownPicker';

function LanguageSelector() {
  const { i18n } = useTranslation(); // i18n instance
  const [locale, setLocale] = React.useState(i18n.language);

  return (
    <View>
      <CustomDropDownPicker
        items={[
          {
            label: 'English',
            value: 'en',
          },
          {
            label: 'Kinyarwanda',
            value: 'rw',
          },
          {
            label: 'Français',
            value: 'fr',
          },
        ]}
        customDropdownWrapperStyle={{
          marginHorizontal: 0,
          alignSelf: 'center',
        }}
        value={locale}
        onSelectItem={(newLanguage) => i18n.changeLanguage(newLanguage.value)}
        setPickerValue={setLocale}
        ArrowDownIconComponent={() => (
          <FontAwesome5 name="chevron-circle-down" size={12} color="#24c38b" />
        )}
        ArrowUpIconComponent={() => (
          <FontAwesome5 name="chevron-circle-up" size={12} color="#24c38b" />
        )}
      />
    </View>
  );
}

export default LanguageSelector;

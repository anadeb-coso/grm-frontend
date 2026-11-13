import React, { useState } from 'react';
import { Text } from 'react-native';
import { Button } from 'react-native-paper';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import moment from 'moment';

import { colors } from '../utils/colors';

/**
 * Date réelle d'une action (acceptation, réouverture, investigation...) : libellé + bouton
 * affichant la date choisie (aujourd'hui par défaut, côté écran appelant), dates futures exclues.
 */
export default function ExactDateField({ label, value, onChange }) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#707070', marginTop: 13, paddingHorizontal: 5 }}>
        {label}
      </Text>
      <Button
        compact
        mode="outlined"
        uppercase={false}
        icon="calendar"
        style={{ alignSelf: 'flex-start', marginTop: 5, marginHorizontal: 5, borderColor: colors.primary }}
        labelStyle={{ color: colors.primary, fontFamily: 'Poppins_400Regular', fontSize: 13 }}
        onPress={() => setVisible(true)}
      >
        {moment(value || new Date()).format('DD/MM/YYYY')}
      </Button>
      <DateTimePickerModal
        isVisible={visible}
        mode="date"
        maximumDate={new Date()}
        date={value || new Date()}
        onConfirm={(date) => {
          onChange(date);
          setVisible(false);
        }}
        onCancel={() => setVisible(false)}
      />
    </>
  );
}

import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Divider, Text } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { colors } from '../../../../utils/colors';

/** Village ayant des plaintes en retard : nombre de plaintes en retard (liste au clic). */
const OverdueVillageNotificationItem = ({ village, onPress }) => {
  const { t } = useTranslation();
  return (
    <>
      <TouchableOpacity style={styles.item} onPress={onPress} accessibilityRole="button">
        <View style={styles.icon}>
          <Feather name="clock" size={20} color="white" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{village.villageName}</Text>
          <Text style={styles.status}>{t('overdue_issues_count', { count: village.count })}</Text>
        </View>
        <Feather name="chevron-right" size={20} color="#b0b0b0" />
      </TouchableOpacity>
      <Divider style={{ marginHorizontal: '5%' }} />
    </>
  );
};

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 18, backgroundColor: 'white',
  },
  icon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.error,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: '#373737' },
  status: { fontFamily: 'Poppins_400Regular', fontSize: 12, marginTop: 4, color: colors.error },
});

export default OverdueVillageNotificationItem;

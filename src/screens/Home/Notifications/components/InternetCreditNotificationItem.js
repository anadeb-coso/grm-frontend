import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Divider, Text } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { colors } from '../../../../utils/colors';
import { ROLE_CVGP } from '../../../../database/internetCredits';

/** Statut affiché sous le titre, selon le rôle et l'état des deux confirmations. */
export function notificationStatus(notification, t) {
  const { role, myConfirmation, cvgpConfirmation, fcConfirmations } = notification;
  if (role === ROLE_CVGP) {
    return { text: t('internet_credit_status_to_confirm'), color: colors.error };
  }
  if (myConfirmation) {
    return { text: t('internet_credit_status_waiting_cvgp'), color: colors.inProgress };
  }
  if (cvgpConfirmation) {
    return { text: t('internet_credit_status_cvgp_confirmed_fc_pending'), color: colors.error };
  }
  if (fcConfirmations.length) {
    return {
      text: t('internet_credit_status_other_fc_confirmed', { name: fcConfirmations[0].confirmedByName || 'FC/AC' }),
      color: colors.inProgress,
    };
  }
  return { text: t('internet_credit_status_to_confirm'), color: colors.error };
}

const InternetCreditNotificationItem = ({ notification, onPress }) => {
  const { t } = useTranslation();
  const { beneficiary, campaign, role } = notification;
  const status = notificationStatus(notification, t);

  return (
    <>
      <TouchableOpacity style={styles.item} onPress={onPress} accessibilityRole="button">
        <View style={styles.icon}>
          <Feather name="wifi" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {t('internet_credit_notification_title', { month: campaign.monthLabel })}
          </Text>
          <Text style={styles.subtitle}>
            {t('internet_credit_cvd', { cvd: beneficiary.cvdName })}
            {role !== ROLE_CVGP && beneficiary.memberName ? ` · ${beneficiary.memberName}` : ''}
          </Text>
          <Text style={[styles.status, { color: status.color }]}>{status.text}</Text>
        </View>
        <Feather name="chevron-right" size={20} color="#b0b0b0" />
      </TouchableOpacity>
      <Divider style={{ marginHorizontal: '5%' }} />
    </>
  );
};

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: 'white',
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(36,195,139,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  title: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: '#373737' },
  subtitle: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#707070', marginTop: 2 },
  status: { fontFamily: 'Poppins_400Regular', fontSize: 12, marginTop: 4 },
});

export default InternetCreditNotificationItem;

import React, { useRef, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Button, Checkbox, DefaultTheme, Text, TextInput } from 'react-native-paper';
import SignatureScreen from 'react-native-signature-canvas';
import { useToast } from 'react-native-toast-notifications';
import { useTranslation } from 'react-i18next';
import moment from 'moment';

import { colors } from '../../../utils/colors';
import { getCurrentUserId } from '../../../api/client';
import {
  ROLE_CVGP,
  createInternetCreditConfirmation,
  useInternetCreditNotifications,
} from '../../../database/internetCredits';
import { runSyncSafely } from '../../../database/watermelonSyncManager';
import { notificationStatus } from './components/InternetCreditNotificationItem';

const theme = { ...DefaultTheme, roundness: 12, colors: { ...DefaultTheme.colors, primary: colors.primary } };

// Masque le pied de page (boutons) intégré au pad : on utilise nos propres boutons.
const SIGNATURE_WEB_STYLE = `
  .m-signature-pad { box-shadow: none; border: none; margin: 0; }
  .m-signature-pad--body { border: none; }
  .m-signature-pad--footer { display: none; margin: 0; }
  body, html { height: 100%; }
`;

const formatAmount = (amount) => `${String(amount ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`;
const formatDate = (date) => (date ? moment(date).format('DD/MM/YYYY') : '—');

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const InternetCreditConfirmation = ({ route, navigation }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const signatureRef = useRef(null);
  const { loading, items } = useInternetCreditNotifications();
  const [checked, setChecked] = useState(false);
  const [signature, setSignature] = useState(null);
  const [description, setDescription] = useState('');
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  const notification = items.find((item) => item.id === route.params?.beneficiaryId);

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} size="large" />;
  }

  if (!notification) {
    // Déjà confirmée (la notification a disparu) ou forfait supprimé depuis.
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={styles.muted}>{t('internet_credit_no_longer_pending')}</Text>
        <Button mode="text" onPress={() => navigation.goBack()} labelStyle={{ color: colors.primary }}>
          {t('back')}
        </Button>
      </SafeAreaView>
    );
  }

  const { beneficiary, campaign, role, message, myConfirmation, cvgpConfirmation, fcConfirmations } = notification;
  const isCvgp = role === ROLE_CVGP;
  const status = notificationStatus(notification, t);
  const canSubmit = checked && !!signature && !saving;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const userId = await getCurrentUserId();
      await createInternetCreditConfirmation({ notification, userId, signature, description });
      toast.show(t('internet_credit_confirmation_saved'), { type: 'success', placement: 'top', duration: 4000 });
      runSyncSafely(); // envoi immédiat si le réseau est disponible, sinon au prochain cycle
      navigation.goBack();
    } catch (err) {
      setSaving(false);
      toast.show(t('internet_credit_confirmation_error'), { type: 'danger', placement: 'top', duration: 5000 });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} scrollEnabled={scrollEnabled} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>{t('internet_credit_notification_title', { month: campaign.monthLabel })}</Text>
          <InfoRow label={t('internet_credit_sent_date')} value={formatDate(campaign.sentDate)} />
          <InfoRow label={t('internet_credit_package')} value={`${campaign.packageLabel} — ${formatAmount(campaign.amount)}`} />
          <InfoRow label={t('internet_credit_cvd_label')} value={beneficiary.cvdName} />
          {beneficiary.villageNames !== beneficiary.cvdName && (
            <InfoRow label={t('internet_credit_villages')} value={beneficiary.villageNames} />
          )}
          {!isCvgp && <InfoRow label={t('internet_credit_cvgp_member')} value={beneficiary.memberName} />}
          {!isCvgp && <InfoRow label={t('internet_credit_phone')} value={beneficiary.phoneNumber} />}
        </View>

        {!isCvgp && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('internet_credit_confirmations_status')}</Text>
            <Text style={styles.statusLine}>
              {t('internet_credit_cvgp_member')} :{' '}
              <Text style={{ color: cvgpConfirmation ? colors.primary : colors.error }}>
                {cvgpConfirmation
                  ? t('internet_credit_confirmed_on', { date: formatDate(cvgpConfirmation.confirmedAt) })
                  : t('internet_credit_not_confirmed')}
              </Text>
            </Text>
            <Text style={styles.statusLine}>
              FC/AC :{' '}
              <Text style={{ color: fcConfirmations.length ? colors.primary : colors.error }}>
                {fcConfirmations.length
                  ? fcConfirmations
                    .map((c) => `${c.confirmedByName || t('you')} (${formatDate(c.confirmedAt)})`)
                    .join(', ')
                  : t('internet_credit_not_confirmed')}
              </Text>
            </Text>
          </View>
        )}

        {myConfirmation ? (
          <View style={styles.card}>
            <Text style={[styles.statusLine, { color: status.color }]}>{status.text}</Text>
            <Text style={styles.muted}>
              {t('internet_credit_you_confirmed_on', { date: formatDate(myConfirmation.confirmedAt) })}
            </Text>
          </View>
        ) : (
          <View style={styles.card}>
            <TouchableOpacity style={styles.checkRow} onPress={() => setChecked(!checked)} activeOpacity={0.7}>
              <Checkbox.Android color={colors.primary} status={checked ? 'checked' : 'unchecked'}
                onPress={() => setChecked(!checked)} />
              <Text style={styles.message}>{message}</Text>
            </TouchableOpacity>

            <View style={styles.signatureHeader}>
              <Text style={styles.sectionTitle}>{t('internet_credit_signature')}</Text>
              <Button compact mode="text" uppercase={false} labelStyle={{ color: colors.primary }}
                onPress={() => { signatureRef.current?.clearSignature(); setSignature(null); }}>
                {t('internet_credit_clear_signature')}
              </Button>
            </View>
            <View style={styles.signaturePad}>
              <SignatureScreen
                ref={signatureRef}
                onBegin={() => setScrollEnabled(false)}
                onEnd={() => { setScrollEnabled(true); signatureRef.current?.readSignature(); }}
                onOK={(img) => setSignature(img)}
                onEmpty={() => setSignature(null)}
                webStyle={SIGNATURE_WEB_STYLE}
                backgroundColor="rgba(255,255,255,1)"
                penColor="#111111"
                imageType="image/png"
                trimWhitespace
                autoClear={false}
                descriptionText=""
              />
            </View>
            {!signature && <Text style={styles.hint}>{t('internet_credit_sign_here')}</Text>}

            <TextInput
              style={styles.input}
              mode="outlined"
              theme={theme}
              multiline
              numberOfLines={3}
              label={t('internet_credit_description_optional')}
              value={description}
              onChangeText={setDescription}
            />

            <Button
              mode="contained"
              theme={theme}
              uppercase={false}
              disabled={!canSubmit}
              loading={saving}
              onPress={onSubmit}
              style={styles.submit}
              labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
            >
              {t('internet_credit_confirm_button')}
            </Button>
            {!checked && <Text style={styles.hint}>{t('internet_credit_check_first')}</Text>}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7f6' },
  centered: { alignItems: 'center', justifyContent: 'center', padding: 30 },
  content: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    elevation: 1,
  },
  title: { fontFamily: 'Poppins_500Medium', fontSize: 16, color: '#373737', marginBottom: 10 },
  sectionTitle: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: '#373737' },
  infoRow: { flexDirection: 'row', paddingVertical: 3 },
  infoLabel: { width: 120, fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#707070' },
  infoValue: { flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#373737' },
  statusLine: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#373737', marginTop: 6 },
  muted: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#707070', marginTop: 6, textAlign: 'left' },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start' },
  message: { flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#373737', paddingTop: 7 },
  signatureHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  signaturePad: {
    height: 200,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#b8c3ca',
    borderRadius: 10,
    overflow: 'hidden',
  },
  hint: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: '#8a97a3', marginTop: 6 },
  input: { marginTop: 14, backgroundColor: 'white' },
  submit: { marginTop: 16, borderRadius: 12, paddingVertical: 4 },
});

export default InternetCreditConfirmation;

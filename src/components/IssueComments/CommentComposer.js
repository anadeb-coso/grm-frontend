import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator, Button, Checkbox, Chip, Dialog, HelperText, Portal, Searchbar, Text, TextInput,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { getCurrentUserId } from '../../api/client';
import { createUserComment, fetchNotificationAccounts, parseEmails } from '../../database/issueNotifications';
import { runSyncSafely } from '../../database/watermelonSyncManager';
import { colors } from '../../utils/colors';

const theme = { roundness: 12, colors: { ...colors, background: 'white', placeholder: '#dedede', text: '#707070' } };

/**
 * Saisie d'un commentaire écrit et de ses options de notification : les membres de l'issue sont
 * notifiés d'office par le serveur ; l'auteur peut ajouter des adresses email et des comptes, et
 * choisir l'envoi par email (case cochée par défaut). Fonctionne hors-ligne : le commentaire part
 * au prochain push (cf. database/issueNotifications.js::createUserComment).
 */
function CommentComposer({ issueId, onSubmitted }) {
  const { t } = useTranslation();
  const { userDocument: eadl } = useSelector((state) => state.get('userDocument').toObject());
  const [text, setText] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [emailsText, setEmailsText] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [accounts, setAccounts] = useState(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { invalid: invalidEmails } = parseEmails(emailsText);
  const canSubmit = !!text.trim() && invalidEmails.length === 0 && !saving;

  const filteredAccounts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (accounts || []).filter((a) => !query || (a.name || '').toLowerCase().includes(query));
  }, [accounts, search]);

  const openPicker = async () => {
    setPickerVisible(true);
    if (accounts === null) {
      setAccounts(await fetchNotificationAccounts());
    }
  };

  const toggleAccount = (account) => {
    setSelectedAccounts((prev) => (prev.some((a) => a.id === account.id)
      ? prev.filter((a) => a.id !== account.id)
      : [...prev, account]));
  };

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const userId = await getCurrentUserId();
      await createUserComment({
        issueId,
        text: text.trim(),
        author: {
          id: eadl?.representative?.id ?? (userId != null ? Number(userId) : null),
          name: eadl?.representative?.name,
        },
        sendEmail,
        notifyEmails: parseEmails(emailsText).valid,
        notifyUserIds: selectedAccounts.map((a) => a.id),
      });
      setText('');
      setEmailsText('');
      setSelectedAccounts([]);
      setSendEmail(true);
      setSaved(true);
      onSubmitted?.();
      runSyncSafely();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        multiline
        mode="outlined"
        theme={theme}
        placeholder={t('write_comment_placeholder')}
        value={text}
        onChangeText={(value) => { setText(value); setSaved(false); }}
      />
      <Checkbox.Item
        label={t('send_comment_by_email')}
        status={sendEmail ? 'checked' : 'unchecked'}
        onPress={() => setSendEmail(!sendEmail)}
        color={colors.primary}
        position="leading"
        labelStyle={styles.checkboxLabel}
        style={styles.checkbox}
      />
      {sendEmail && (
        <>
          <TextInput
            mode="outlined"
            dense
            theme={theme}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder={t('other_emails_to_notify')}
            value={emailsText}
            onChangeText={setEmailsText}
          />
          <HelperText type="error" visible={invalidEmails.length > 0}>
            {t('invalid_emails', { emails: invalidEmails.join(', ') })}
          </HelperText>
        </>
      )}
      <View style={styles.accountsRow}>
        <Text style={styles.accountsLabel}>{t('accounts_to_notify')}</Text>
        <Button compact mode="text" textColor={colors.primary} onPress={openPicker}>
          {t('choose_accounts')}
        </Button>
      </View>
      <View style={styles.chips}>
        {selectedAccounts.map((account) => (
          <Chip key={account.id} style={styles.chip} onClose={() => toggleAccount(account)}>
            {account.name}
          </Chip>
        ))}
      </View>
      <Button
        mode="contained"
        theme={theme}
        style={styles.submit}
        labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
        disabled={!canSubmit}
        loading={saving}
        onPress={submit}
      >
        {t('send_comment')}
      </Button>
      {saved && <HelperText type="info" visible>{t('comment_saved')}</HelperText>}

      <Portal>
        <Dialog visible={pickerVisible} onDismiss={() => setPickerVisible(false)}>
          <Dialog.Title>{t('accounts_to_notify')}</Dialog.Title>
          <Dialog.Content>
            <Searchbar placeholder={t('search_account')} value={search} onChangeText={setSearch} />
          </Dialog.Content>
          <Dialog.ScrollArea style={styles.pickerList}>
            {accounts === null ? (
              <ActivityIndicator style={{ marginVertical: 20 }} color={colors.primary} />
            ) : (
              <FlatList
                data={filteredAccounts}
                keyExtractor={(item) => String(item.id)}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={<Text style={styles.empty}>{t('no_accounts_available')}</Text>}
                renderItem={({ item }) => (
                  <Checkbox.Item
                    label={item.name}
                    status={selectedAccounts.some((a) => a.id === item.id) ? 'checked' : 'unchecked'}
                    onPress={() => toggleAccount(item)}
                    color={colors.primary}
                    position="leading"
                    labelStyle={styles.checkboxLabel}
                  />
                )}
              />
            )}
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button textColor={colors.primary} onPress={() => setPickerVisible(false)}>{t('done')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 10 },
  checkbox: { paddingHorizontal: 0 },
  checkboxLabel: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#707070', textAlign: 'left' },
  accountsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  accountsLabel: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#707070' },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { marginRight: 6, marginBottom: 6 },
  submit: { alignSelf: 'flex-end', marginTop: 8 },
  pickerList: { maxHeight: 320, paddingHorizontal: 0 },
  empty: { padding: 16, color: '#707070' },
});

export default CommentComposer;

import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, ScrollView, Text, View } from 'react-native';
import { ActivityIndicator, Button, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { login as jwtLogin } from '../../../api/client';
import { login } from '../../../store/ducks/authentication.duck';
import { cddBaseURL } from '../../../services/env';
import {
  firstLoginPasswordPayload,
  isPasswordChangeRequiredError,
  newPasswordErrorKeys,
} from '../../../utils/firstLoginPassword';

// Changement obligatoire du mot de passe initial (compte créé dans le DCC) avant la première connexion : fait par
// le DCC pour toutes les plateformes (DCC, MGP, SIG). Ouvert par l'écran de connexion avec l'e-mail et le mot de
// passe saisis ; connexion automatique ensuite.
function FirstLoginPassword({ route, navigation }) {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const email = route?.params?.email || '';
  const currentPassword = route?.params?.password || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [secure, setSecure] = useState(true);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const errorKeys = newPasswordErrorKeys(newPassword, confirmation, currentPassword);
    setErrors(errorKeys.map((key) => t(key)));
    if (errorKeys.length) {
      return;
    }
    setLoading(true);
    let result;
    try {
      const response = await axios.post(
        `${cddBaseURL}/authentication/api/first-login-password/`,
        firstLoginPasswordPayload(email, currentPassword, newPassword, confirmation, i18n.language),
        { headers: { 'Content-Type': 'application/json' }, validateStatus: (status) => status < 500 },
      );
      result = response.data;
    } catch (error) {
      result = { ok: false, message: t('first_login_password_network_error') };
    }
    if (!result?.ok) {
      setLoading(false);
      setErrors([result?.message || t('first_login_password_error')]);
      return;
    }

    try {
      // Connexion avec le nouveau mot de passe (jetons rangés par `jwtLogin`, synchronisation lancée par le duck).
      await jwtLogin(email, newPassword);
      setLoading(false);
      Alert.alert(t('first_login_password_success'), result.message || '');
      dispatch(login({ email }));
    } catch (error) {
      setLoading(false);
      Alert.alert(
        t('login'),
        isPasswordChangeRequiredError(error) ? t('first_login_password_error') : t('first_login_password_login_again'),
      );
      navigation.navigate('Login');
    }
  };

  const passwordInput = (value, onChange, label) => (
    <TextInput
      mode="outlined"
      label={label}
      value={value}
      onChangeText={onChange}
      secureTextEntry={secure}
      autoCapitalize="none"
      maxLength={16}
      theme={{ roundness: 10, colors: { primary: '#24c38b' } }}
      style={{ marginBottom: 12 }}
      right={<TextInput.Icon icon={secure ? 'eye-off' : 'eye'} onPress={() => setSecure(!secure)} />}
    />
  );

  return (
    <ScrollView style={{ backgroundColor: 'white', paddingHorizontal: 30 }} contentContainerStyle={{ flexGrow: 1 }}>
      <KeyboardAvoidingView behavior="position">
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#24c38b', marginTop: 20, marginBottom: 10 }}>
          {t('first_login_password_heading')}
        </Text>
        <Text style={{ color: '#333', marginBottom: 20 }}>{t('first_login_password_intro', { email })}</Text>
        {passwordInput(newPassword, setNewPassword, t('first_login_password_new'))}
        {passwordInput(confirmation, setConfirmation, t('first_login_password_confirm'))}
        <Text style={{ color: 'gray', marginBottom: 10 }}>{t('first_login_password_rules')}</Text>
        {errors.map((error) => (
          <Text key={error} style={{ color: 'red', marginBottom: 6 }}>{error}</Text>
        ))}
        <View style={{ marginTop: 20, alignItems: 'center' }}>
          {loading ? (
            <ActivityIndicator color="#24c38b" />
          ) : (
            <Button mode="contained" color="#24c38b" onPress={onSubmit}>
              {t('first_login_password_submit')}
            </Button>
          )}
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

export default FirstLoginPassword;

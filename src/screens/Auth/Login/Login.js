import React, { useState } from 'react';

import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  Text,
  TouchableWithoutFeedback,
  View,
  TouchableOpacity
} from 'react-native';
import { ActivityIndicator, Button, TextInput } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { login as jwtLogin } from '../../../api/client';
import { login } from '../../../store/ducks/authentication.duck';

import MESSAGES from '../../../utils/formErrorMessages';
import { emailRegex, passwordRegex } from '../../../utils/formUtils';
import styles from './Login.style';
import ThinkingSVG from '../../../../assets/think.svg';

function Login() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);
  const [isPasswordSecure, setIsPasswordSecure] = useState(true);
  const [loginError, setLoginError] = useState(null);

  const onLoginPress = async (data) => {
    setLoading(true);
    setLoginError(null);
    try {
      // Authentification JWT (grm-backend/src/sync : /api/auth/token/) — remplace l'ancien flux
      // de connexion CouchDB. `jwtLogin` stocke déjà les tokens de façon chiffrée
      // (src/api/client.js), la synchronisation WatermelonDB démarre depuis le duck (voir
      // authentication.duck.js::login -> startWatermelonSync()).
      await jwtLogin(data?.email, data?.password);

      // Le profil ADL (village/commune géré) est chargé séparément par `router/index.js`, dès
      // que `username` change dans le store `authentication` (déclenché par `dispatch(login(...))`
      // ci-dessous) — inutile de le refaire ici (c'était auparavant un appel direct CouchDB,
      // systématiquement en échec depuis le passage au JWT, qui empêchait ce dispatch de
      // s'exécuter). Le mot de passe n'est pas transmis au store : seul le JWT (déjà stocké par
      // `jwtLogin` ci-dessus) sert à authentifier les appels suivants.
      dispatch(login({ email: data?.email }));
    } catch (error) {
      console.error(error);
      // `jwtLogin` (src/api/client.js) fait un appel axios brut, sans intercepteur : l'erreur HTTP
      // (401 SimpleJWT, ou erreur réseau si hors-ligne) remontait ici sans jamais être affichée —
      // l'utilisateur voyait juste le spinner disparaître, sans aucun feedback.
      const status = error?.response?.status;
      const message =
        status === 401 || status === 400
          ? t('login_invalid_credentials')
          : error?.request
          ? t('login_network_error')
          : t('login_error_generic');
      setLoginError(message);
      Alert.alert(t('login'), message, [{ text: 'OK' }], { cancelable: false });
    } finally {
      setLoading(false);
    }
  };

  const { control, handleSubmit, errors } = useForm({
    criteriaMode: 'all',
  });

  return (
    <ScrollView
      style={{
        backgroundColor: 'white',
        flex: 1,
        paddingBottom: 30,
        paddingHorizontal: 30,
      }}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <KeyboardAvoidingView style={styles.containerView} behavior="position">
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          {/* <MapBg */}
          {/*  width={220} */}
          {/*  height={190} */}
          {/*  style={{ */}
          {/*    marginTop: -50, */}
          {/*  }} */}
          {/* /> */}
          <View>
            <ThinkingSVG />
          </View>
        </View>
        

        <View style={{ 
          marginBottom: 25,//50, 
          marginTop: 25,//70, 
          alignItems: 'center' 
          }}>
          {/* <EADLLogo height={90} width={180} /> */}
          <Text
            style={{
              marginBottom: 15,
              fontFamily: 'Poppins_400Regular',
              fontSize: 19,
              fontWeight: 'bold',
              fontStyle: 'normal',
              lineHeight: 23,
              letterSpacing: 0,
              textAlign: 'center',
              color: '#707070',
            }}
          >
            {t('welcome_login')}
          </Text>
        </View>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.loginScreenContainer}>
            <KeyboardAvoidingView style={styles.containerView} behavior="padding">
              <View style={styles.formContainer}>
                <View style={{ borderRadius: 10, marginBottom: 16 }}>
                  <Controller
                    control={control}
                    render={({ onChange, onBlur, value }) => (
                      <TextInput
                        theme={{
                          roundness: 10,
                          colors: {
                            primary: '#24c38b',
                            placeholder: '#dedede',
                          },
                        }}
                        autoCapitalize="none"
                        label={t('email')}
                        mode="outlined"
                        labelColor="#dedede"
                        style={styles.loginFormTextInput}
                        left={<TextInput.Icon icon="account" color="#24c38b" />}
                        onBlur={onBlur}
                        onChangeText={(value) => onChange(value)}
                        value={value}
                      />
                    )}
                    name="email"
                    rules={{
                      required: {
                        value: true,
                        message: MESSAGES.required,
                      },
                      pattern: {
                        value: emailRegex,
                        message: 'Please enter a valid email address',
                      },
                    }}
                    defaultValue=""
                  />
                  {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
                  <Controller
                    control={control}
                    render={({ onChange, onBlur, value }) => (
                      <TextInput
                        theme={{
                          roundness: 10,
                          colors: {
                            primary: '#24c38b',
                            placeholder: '#dedede',
                          },
                        }}
                        mode="outlined"
                        placeholderColor="#dedede"
                        label={t('password')}
                        style={styles.loginFormTextInput}
                        left={
                          <TextInput.Icon
                            onPress={() => setIsPasswordSecure(!isPasswordSecure)}
                            icon={isPasswordSecure ? 'eye-off-outline' : 'eye-outline'}
                            color="#24c38b"
                          />
                        }
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        secureTextEntry={isPasswordSecure}
                      />
                    )}
                    name="password"
                    rules={{
                      required: {
                        value: true,
                        message: MESSAGES.required,
                      },
                      minLength: {
                        value: 8,
                        message: MESSAGES.minLength,
                      },
                      pattern: {
                        value: passwordRegex,
                        message: MESSAGES.password,
                      },
                      maxLength: {
                        value: 40,
                        message: MESSAGES.maxLength,
                      },
                    }}
                    defaultValue=""
                  />
                  {errors.password && (
                    <Text style={styles.errorText}>{errors.password.message}</Text>
                  )}
                  {loginError && <Text style={styles.errorText}>{loginError}</Text>}
                </View>

                {/* <TouchableOpacity style={styles.hintContainer}> */}
                {/*  <Text style={styles.textHint}>Forgo?</Text> */}
                {/* </TouchableOpacity> */}
              </View>
            </KeyboardAvoidingView>
            <TouchableOpacity style={{}}
              onPress={() => navigation.navigate('PasswordLoss')}
            >
              <Text style={{ color: 'green' }}>{t('password_forget')}</Text>
            </TouchableOpacity>
            {loading ? (
              <ActivityIndicator color="#24c38b" />
            ) : (
              <Button
                style={[
                  styles.loginButton,
                  {
                    backgroundColor: errors ? '#24c38b' : '#dedede',
                    // marginTop: '40%',
                    marginTop: 25,
                  },
                ]}
                onPress={handleSubmit(onLoginPress)}
                color="white"
              >
                {t('login')}
              </Button>
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

export default Login;

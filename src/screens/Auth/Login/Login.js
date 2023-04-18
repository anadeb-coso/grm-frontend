import React, { useState } from 'react';

import i18n from 'i18n-js';
import { Controller, useForm } from 'react-hook-form';
import {
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { ActivityIndicator, Button, TextInput } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import API from '../../../services/API';
import { login } from '../../../store/ducks/authentication.duck';
import { setCommune, setDocument } from '../../../store/ducks/userDocument.duck';

import { getUserDocs } from '../../../utils/databaseManager';
import MESSAGES from '../../../utils/formErrorMessages';
import { emailRegex, passwordRegex } from '../../../utils/formUtils';
import { getEncryptedData } from '../../../utils/storageManager';
import styles from './Login.style';

function Login() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [isPasswordSecure, setIsPasswordSecure] = useState(true);

  const onLoginPress = async (data) => {
    setLoading(true);
    const dbConfig = await getEncryptedData(
      `dbCredentials_${data?.password}_${data?.email.replace('@', '')}`
    );
    if (dbConfig) {
      console.log('<<<<<<>UUUUUUUUUUU>>>', data?.email);
      const { userDoc, userCommune } = await getUserDocs(data?.email);
      if (userDoc) {
        dispatch(setDocument(userDoc)); // Dispatch setDocument action
      }
      if (userCommune) {
        dispatch(setCommune(userCommune)); // Dispatch setCommune action
      }
      dispatch(login(dbConfig, { email: data?.email, password: data?.password }));
    } else {
      new API()
        .login({ email: data?.email, password: data?.password })
        .then(async (response) => {
          if (response.error) {
            return;
          }
          console.log('<<<<<<>TTTTTTTTTTTTTTT>>>', data?.email);
          const { userDoc, userCommune } = await getUserDocs(data?.email);
          if (userDoc) {
            dispatch(setDocument(userDoc)); // Dispatch setDocument action
          }
          if (userCommune) {
            dispatch(setCommune(userCommune)); // Dispatch setCommune action
          }
          dispatch(login(response, data));

          setLoading(false);
        })
        .catch((error) => {
          setLoading(false);
          console.error(error);
        });
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
        </View>

        <View style={{ marginBottom: 50, marginTop: 70, alignItems: 'center' }}>
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
            {i18n.t('welcome_login')}
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
                        label={i18n.t('email')}
                        mode="outlined"
                        labelColor="#dedede"
                        style={styles.loginFormTextInput}
                        left={<TextInput.Icon name="account" color="#24c38b" />}
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
                        label={i18n.t('password')}
                        style={styles.loginFormTextInput}
                        left={
                          <TextInput.Icon
                            onPress={() => setIsPasswordSecure(!isPasswordSecure)}
                            name={isPasswordSecure ? 'eye-off-outline' : 'eye-outline'}
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
                </View>

                {/* <TouchableOpacity style={styles.hintContainer}> */}
                {/*  <Text style={styles.textHint}>Forgo?</Text> */}
                {/* </TouchableOpacity> */}
              </View>
            </KeyboardAvoidingView>
            {loading ? (
              <ActivityIndicator color="#24c38b" />
            ) : (
              <Button
                style={[
                  styles.loginButton,
                  {
                    backgroundColor: errors ? '#24c38b' : '#dedede',
                    marginTop: '40%',
                  },
                ]}
                onPress={handleSubmit(onLoginPress)}
                color="white"
              >
                {i18n.t('login')}
              </Button>
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

export default Login;

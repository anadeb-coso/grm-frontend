import React, { useContext, useEffect, useState } from 'react';

import {
  Keyboard,
  Text,
  View,
  TouchableWithoutFeedback,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { useToast } from 'react-native-toast-notifications';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import styles from './ChangePassword.style';
import MESSAGES from '../../../utils/formErrorMessages';
import { passwordRegex } from '../../../utils/formUtils';
import { validatePassword } from '../../../utils/functions';
import { logout } from '../../../store/ducks/authentication.duck';
import { cddBaseURL } from '../../../services/env';


function ChangePasswordScreen() {
  const toast = useToast();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { username } = useSelector((state) => state.get('authentication').toObject());
  const { userDocument: eadl } = useSelector((state) => state.get('userDocument').toObject());

  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [isPasswordSecure, setIsPasswordSecure] = useState(true);
  const [isCurrentPasswordSecure, setIsCurrentPasswordSecure] = useState(true);
  const [isConfirmPasswordSecure, setIsConfirmPasswordSecure] = useState(true);
  
  const [password, setPassword] = useState(null);
  const [currentPassword, setCurrentPassword] = useState(null);
  const [_validatePassword, set_validatePassword] = useState(null);
  const [isPasswordConfirm, setIsPasswordConfirm] = useState(null);

  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [encoderEmail, setEncoderEmail] = useState(null);

  const [error, setError] = useState(null);

  const onPress = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${cddBaseURL}/api/change-password/`,
        { ...data, email: eadl.representative.email }, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.status === 200 && response.data.ok == true) {
        toast.show(response.data.message, {
            type: "success",
            placement: "bottom",
            duration: 3000,
          });

        setLoading(false);
        
        dispatch(logout());

      } else {
        Alert.alert('Erreur', response.data.message);
        setLoading(false);
        setError(response.data.message);
      }

    } catch (error) {
      Alert.alert('Erreur', error.message);
      setError(error.message);
      setLoading(false);
    }



    // show error
  };


  const { control, handleSubmit, errors } = useForm({
    criteriaMode: 'all',
  });

  return (
    <ScrollView
      style={{
        backgroundColor: 'white',
        paddingBottom: 30,
        paddingHorizontal: 30,
      }}
      contentContainerStyle={{ flexGrow: 1 }}
    >

      {codeSent ?
        <KeyboardAvoidingView
          style={{
            flex: 1,
            backgroundColor: 'white',
            justifyContent: 'space-between',
            marginBottom: 50,
            marginTop: 50,
          }}
          contentContainerStyle={{ flex: 1, justifyContent: 'space-evenly' }}
          behavior="position"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1, justifyContent: 'space-between' }}>
              <View
                style={{
                  backgroundColor: 'white',
                }}
              >
                <KeyboardAvoidingView
                  style={{
                    backgroundColor: 'white',
                  }}
                  behavior="padding"
                >
                  <View style={[styles.formContainer]}>
                    <View
                      style={{
                        borderRadius: 10,
                        marginBottom: 3,
                      }}
                    >


                      <Controller
                        control={control}
                        render={({ onChange, onBlur, value }) => (
                          <View style={{ flexDirection: 'row' }}>
                            <TextInput
                              theme={{
                                roundness: 10,
                                colors: {
                                  primary: '#24c38b',
                                  placeholder: '#dedede',
                                },
                              }}
                              mode="outlined"
                              label={`${t('confirm_code')}`}
                              style={{
                                flex: 1,
                              }}
                              left
                              value={value}
                              onBlur={onBlur}
                              onChangeText={onChange}
                            />
                          </View>
                        )}
                        name="confirm_code"
                        rules={{
                          required: {
                            value: true,
                            message: MESSAGES.required,
                          }
                        }}
                        defaultValue=""
                      />

                      <Text style={{ color: 'gray' }}>
                        {t('code_mail_sended')}{` ${encoderEmail ? '(' + encoderEmail + ')' : ''}`}
                      </Text>


                      {/* Current PAssword */}
                      <View style={{ height: 30 }} />
                      <Controller
                        control={control}
                        render={({ onChange, onBlur, value }) => (
                          <View style={{ flexDirection: 'row' }}>
                            <Ionicons
                              onPress={() =>
                                setIsCurrentPasswordSecure(!isCurrentPasswordSecure)
                              }
                              name={
                                isCurrentPasswordSecure
                                  ? 'eye-off-outline'
                                  : 'eye-outline'
                              }
                              color="#24c38b"
                              size={30}
                              style={{ textAlignVertical: 'center', marginRight: 5 }}
                            />
                            <TextInput
                              theme={{
                                roundness: 10,
                                colors: {
                                  primary: '#24c38b',
                                  placeholder: '#dedede',
                                },
                              }}
                              mode="outlined"
                              label={`${t('current_password')}`}
                              style={{
                                flex: 1,
                              }}
                              left
                              value={value}
                              onBlur={onBlur}
                              onChangeText={(text) => {
                                onChange(text);
                                setCurrentPassword(text);
                              }}
                              secureTextEntry={isCurrentPasswordSecure}
                            />
                          </View>
                        )}
                        name="current_password"
                        rules={{
                          required: {
                            value: true,
                            message: MESSAGES.required,
                          },
                        }}
                        defaultValue=""
                      />
                      {/* End Current PAssword */}



                      {/* New Password */}
                      <View style={{ height: 10 }} />
                      <Controller
                        control={control}
                        render={({ onChange, onBlur, value }) => (
                          <View style={{ flexDirection: 'row' }}>
                            <Ionicons
                              onPress={() =>
                                setIsPasswordSecure(!isPasswordSecure)
                              }
                              name={
                                isPasswordSecure
                                  ? 'eye-off-outline'
                                  : 'eye-outline'
                              }
                              color="#24c38b"
                              size={30}
                              style={{ textAlignVertical: 'center', marginRight: 5 }}
                            />
                            <TextInput
                              // placeholder="Nouveau mot de passe"
                              theme={{
                                roundness: 10,
                                colors: {
                                  primary: '#24c38b',
                                  placeholder: '#dedede',
                                },
                              }}
                              mode="outlined"
                              label={`${t('new_password')}`}
                              style={{
                                flex: 1,
                              }}
                              left
                              value={value}
                              onBlur={onBlur}
                              onChangeText={(text) => {
                                onChange(text);
                                setPassword(text);
                                set_validatePassword(validatePassword(text));
                              }}
                              secureTextEntry={isPasswordSecure}
                            />
                          </View>
                        )}
                        name="password_new"
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
                        <Text style={styles.errorText}>
                          {errors.password.message}
                        </Text>
                      )}
                      {_validatePassword != true && (
                        <Text style={styles.errorText}>
                          {_validatePassword}
                        </Text>
                      )}
                      <Text style={{ color: 'gray' }}>{t('help_new_password')}</Text>

                      {/* End New Password */}



                      {/* Confirm New Password */}
                      <View style={{ height: 10 }} />
                      <Controller
                        control={control}
                        render={({ onChange, onBlur, value }) => (
                          <View style={{ flexDirection: 'row' }}>
                            <Ionicons
                              onPress={() =>
                                setIsConfirmPasswordSecure(!isConfirmPasswordSecure)
                              }
                              name={
                                isConfirmPasswordSecure
                                  ? 'eye-off-outline'
                                  : 'eye-outline'
                              }
                              color="#24c38b"
                              size={30}
                              style={{ textAlignVertical: 'center', marginRight: 5 }}
                            />
                            <TextInput
                              theme={{
                                roundness: 10,
                                colors: {
                                  primary: '#24c38b',
                                  placeholder: '#dedede',
                                },
                              }}
                              mode="outlined"
                              label={`${t('new_password_confirmation')}`}
                              style={{
                                flex: 1,
                              }}
                              left
                              value={value}
                              onBlur={onBlur}
                              onChangeText={(text) => {
                                onChange(text);
                                setIsPasswordConfirm(text == password);
                              }}
                              secureTextEntry={isConfirmPasswordSecure}
                            />
                          </View>
                        )}
                        name="password_new_confirm"
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
                        <Text style={styles.errorText}>
                          {errors.password.message}
                        </Text>
                      )}
                      {(!isPasswordConfirm && isPasswordConfirm != null) && (
                        <Text style={styles.errorText}>
                          {t('help_new_password_confirmation')}
                        </Text>
                      )}
                      {/* End Confirm New Password */}



                    </View>
                  </View>
                </KeyboardAvoidingView>


              </View>


              {error && (
                <Text style={styles.errorText}>
                  {error}
                </Text>
              )}

              <View
                style={{
                  backgroundColor: 'white',
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#24c38b" />
                ) : (
                  <TouchableOpacity 
                    disabled={_validatePassword != true || _validatePassword == null || !isPasswordConfirm || isPasswordConfirm == null || currentPassword == null}
                    style={{
                      height: 42,
                      borderRadius: 7,
                      backgroundColor: (
                        (_validatePassword != true || _validatePassword == null || !isPasswordConfirm || isPasswordConfirm == null || currentPassword == null) ?
                        'gray'
                        : '#24c38b'),
                      justifyContent: 'center',
                      alignItems: 'center',
                      alignSelf: 'center',
                      paddingHorizontal: 20,
                    }}
                    onPress={handleSubmit(onPress)}
                  >
                    <Text style={{ color: 'white' }}>{t('edit')}</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View />
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView> : <View>
          <View
            style={{
              marginBottom: 50,
              marginTop: 70,
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
            }}
          >
            <Text
              style={{
                fontFamily: 'Poppins_700Bold',
                lineHeight: 22,
                letterSpacing: 0,
                textAlign: 'left',
                color: 'gray',
              }}
            >
              {t('infos_about_password_change')}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: 'white',
            }}
          >
            {sendingCode && <Text style={{ color: 'green' }}>{t('code_mail_send')}</Text>}
            {sendingCode ? (
              <ActivityIndicator color="#24c38b" />
            ) : (
              <TouchableOpacity
                style={{
                  height: 42,
                  borderRadius: 7,
                  backgroundColor: '#24c38b',
                  justifyContent: 'center',
                  alignItems: 'center',
                  alignSelf: 'center',
                  paddingHorizontal: 20,
                }}
                onPress={async () => {
                  setCodeSent(false);
                  setSendingCode(true);
                  try {
                    const response = await axios.post(`${cddBaseURL}/api/user-manager-email-notification/`, {
                      email: eadl.representative.email,
                      username: username,
                    }, {
                      headers: { 'Content-Type': 'application/json' }
                    });
                    if (response.status === 200) {
                      setCodeSent(true);
                      setSendingCode(false);
                      toast.show(response.data.message, {
                        type: "success",
                        placement: "bottom",
                        duration: 3000,
                      });
                      setEncoderEmail(response.data.encoder_email);

                    } else {
                      Alert.alert('Erreur', response.data.encoder_email);
                      setSendingCode(false);
                    }

                  } catch (error) {
                    Alert.alert('Erreur', error.message);
                    setSendingCode(false);
                  }

                }}
              >
                <Text style={{ color: 'white' }}>{t('send_me_code')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>}

    </ScrollView>
  );
}

export default ChangePasswordScreen;

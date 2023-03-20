import React, {useState, useEffect} from "react";

import styles from "./SignUp.style";
import {
  Keyboard,
  Text,
  View,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Modal,
  StyleSheet,
  ScrollView,
  Alert,
  ToastAndroid,
} from "react-native";
import { ActivityIndicator, Button, Provider } from "react-native-paper";

import { useDispatch } from "react-redux";
import { signUp } from "../../../store/ducks/authentication.duck";
import MapBg from "../../../../assets/map-bg.svg";
import EADLLogo from "../../../../assets/eadl-logo.svg";
import { TextInput } from "react-native-paper";
import { Controller, useForm } from "react-hook-form";
// import CodeInput from "react-native-code-input";
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';

import MESSAGES from "../../../utils/formErrorMessages";
import { emailRegex, passwordRegex } from "../../../utils/formUtils";
import CodeLogo from "../../../../assets/code_logo.svg";
import SuccessLogo from "../../../../assets/success_logo.svg";
import BigCheck from "../../../../assets/big-check.svg";
import API from "../../../services/API";
import { colors } from "../../../utils/colors";
import i18n from 'i18n-js';


const CELL_COUNT = 6;

function SignUp({ route }) {
  const dispatch = useDispatch();
  const [codeModal, setCodeModal] = React.useState(false);
  const [credentials, setCredentials] = React.useState();
  const [loading, setLoading] = React.useState(false);
  const [successModal, setSuccessModal] = React.useState(false);
  const [isPasswordSecure, setIsPasswordSecure] = useState(true);
  const { control, handleSubmit, errors, watch } = useForm({
    criteriaMode: "all",
  });
  const password = React.useRef({});
  password.current = watch("password", "");

  const [value, setValue] = React.useState('');
  const ref = useBlurOnFulfill({value, cellCount: CELL_COUNT});
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({value, setValue});

  const hideModal = () => setCodeModal(false);
  const hideSuccessModal = (response) => {
    setSuccessModal(false);
    dispatch(signUp(response, credentials));
  };
  const onSignUp = (code) => {
    setLoading(true);
    // handle code with backend, check if valid
    new API()
      .signUp({ ...credentials, validation_code: code })
      .then((response) => {
        if (response.error) {
          setLoading(false);
          Alert.alert(
            "Sign Up Error",
            response?.non_field_errors[0],
            [{ text: "OK" }],
            { cancelable: false }
          );
          return;
        }
        setLoading(false);
        setSuccessModal(true);
        setTimeout(function () {
          hideSuccessModal(response);
        }, 3000);
      });
    hideModal();
  };
  const onPressSignUp = (data) => {
    setCredentials(data);
    setCodeModal(true);
  };

  return (
    <Provider>
      {loading && (
        <View
          style={{
            zIndex: 20,
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
      <Modal statusBarTranslucent animationType={"slide"} visible={codeModal}>
        <ScrollView contentContainerStyle={{ flex: 1, alignItems: "center" }}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={"position"}>
            <CodeLogo />
            <Text style={modalStyles.title}>
              {i18n.t('last_validation')}
            </Text>
            <Text
              style={{
                marginTop: 20,
                marginBottom: 30,
                fontFamily: "Poppins_500Medium",
                fontSize: 12,
                fontWeight: "500",
                fontStyle: "normal",
                lineHeight: 12,
                letterSpacing: 0,
                textAlign: "center",
                color: "#707070",
              }}
            >
              {i18n.t('please_enter_code')}
            </Text>
            {/* <CodeInput
              // secureTextEntry
              space={15}
              activeColor="#008a57"
              inactiveColor="#d9d9d9"
              codeLength={6}
              codeInputStyle={{
                width: 40,
                height: 44,
                borderRadius: 10,
                backgroundColor: "#ffffff",
                borderStyle: "solid",
                borderWidth: 1,
                borderColor: "#008a57",
                fontSize: 25,
              }}
              containerStyle={{ flex: 0.3 }}
              inputPosition="center"
              onFulfill={(code) => onSignUp(code)}
            /> */}
            <CodeField
        ref={ref}
        {...props}
        // caretHidden={false}
        value={value}
        onChangeText={setValue}
        cellCount={CELL_COUNT}
        rootStyle={codeStyles.codeFieldRoot}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        renderCell={({index, symbol, isFocused}) => (
          <Text
            key={index}
            style={[codeStyles.cell, isFocused && codeStyles.focusCell]}
            onLayout={getCellOnLayoutHandler(index)}>
            {symbol || (isFocused ? <Cursor /> : null)}
          </Text>
        )}
      />

        <Button
          style={[
            styles.loginButton,
            {
              backgroundColor: errors ? "#24c38b" : "#dedede",
              marginTop: "40%",
            },
          ]}
          onPress={() => {
              if(value.length === 6){
                onSignUp(value);
              }else{
                ToastAndroid.show(`${i18n.t('error_message_for_code')}`, ToastAndroid.SHORT);
              }
            }
          }
          color={"white"}
        >
          {i18n.t('next')}
        </Button>


          </KeyboardAvoidingView>
        </ScrollView>
      </Modal>
      <Modal animationType={"slide"} visible={successModal}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "space-evenly",
          }}
        >
          <BigCheck height={82} width={82} />
          <SuccessLogo />
          <Text
            style={{
              fontFamily: "Poppins_700Bold",
              fontSize: 20,
              fontWeight: "bold",
              fontStyle: "normal",
              lineHeight: 21,
              letterSpacing: 0,
              textAlign: "center",
              color: "#707070",
            }}
          >

            {i18n.t('account_create_success')}
          </Text>
        </View>
      </Modal>
      <ScrollView
        style={{
          backgroundColor: "white",
          flex: 1,
          paddingBottom: 30,
          paddingHorizontal: 30,
        }}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <KeyboardAvoidingView style={styles.containerView} behavior="position">
          <View style={{ alignItems: "center", justifyContent: "center" }}>
            {/*<MapBg*/}
            {/*  width={220}*/}
            {/*  height={190}*/}
            {/*  style={{*/}
            {/*    marginTop: -50,*/}
            {/*  }}*/}
            {/*/>*/}
          </View>

            <View style={{ marginBottom: 50, marginTop: 70, alignItems: "center" }}>
                {/*<EADLLogo height={90} width={180} />*/}
                <Text style={{
                    marginBottom: 15,
                    fontFamily: "Poppins_400Regular",
                    fontSize: 19,
                    fontWeight: "bold",
                    fontStyle: "normal",
                    lineHeight: 23,
                    letterSpacing: 0,
                    textAlign: "center",
                    color: "#707070",
                }}>{i18n.t('email_provided')}</Text>
            </View>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.loginScreenContainer}>
              <View style={styles.formContainer}>
                <View style={{ borderRadius: 10, marginBottom: 16 }}>
                  <Controller
                    control={control}
                    render={({ onChange, onBlur, value }) => (
                      <TextInput
                        theme={{
                          roundness: 10,
                          colors: {
                            primary: "#24c38b",
                            placeholder: "#dedede",
                          },
                        }}
                        mode={"outlined"}
                        label={i18n.t('email')}
                        labelColor="#dedede"
                        style={styles.loginFormTextInput}
                        left={
                          <TextInput.Icon name="account" color={"#24c38b"} />
                        }
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
                        message: "Please enter a valid email address",
                      },
                    }}
                    defaultValue=""
                  />
                  {errors.email && (
                    <Text style={styles.errorText}>{errors.email.message}</Text>
                  )}
                  <Controller
                    control={control}
                    render={({ onChange, onBlur, value }) => (
                      <TextInput
                        theme={{
                          roundness: 10,
                          colors: {
                            primary: "#24c38b",
                            placeholder: "#dedede",
                          },
                        }}
                        mode={"outlined"}
                        label={i18n.t('choose_password')}
                        placeholderColor={"#dedede"}
                        style={styles.loginFormTextInput}
                        left={
                          <TextInput.Icon
                              onPress={() => setIsPasswordSecure(!isPasswordSecure)}
                              name={isPasswordSecure ? "eye-off-outline" : "eye-outline"}
                              color={"#24c38b"}
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
                      pattern: {
                        value: passwordRegex,
                        message: MESSAGES.password,
                      },
                      minLength: {
                        value: 8,
                        message: MESSAGES.minLength,
                      },
                      maxLength: {
                        value: 16,
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
                </View>

                <View style={styles.hintContainer}>
                  <Text style={styles.textHint}>
                    {i18n.t('enter_new_password')}
                  </Text>
                </View>
              </View>
              <Button
                style={[
                  styles.loginButton,
                  {
                    backgroundColor: errors ? "#24c38b" : "#dedede",
                    marginTop: "40%",
                  },
                ]}
                onPress={handleSubmit(onPressSignUp)}
                color={"white"}
              >
                {i18n.t('next')}
              </Button>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </ScrollView>
    </Provider>
  );
}

export default SignUp;

const modalStyles = StyleSheet.create({
  title: {
    marginTop: 30,
    fontFamily: "Poppins_700Bold",
    fontSize: 19,
    fontWeight: "bold",
    fontStyle: "normal",
    lineHeight: 23,
    letterSpacing: 0,
    textAlign: "center",
    color: "#707070",
  },
});

const codeStyles = StyleSheet.create({
  root: {flex: 1, padding: 20},
  title: {textAlign: 'center', fontSize: 30},
  codeFieldRoot: {marginTop: 20},
  cell: {
    width: 40,
    height: 40,
    lineHeight: 38,
    fontSize: 24,
    borderWidth: 2,
    borderColor: '#00000030',
    textAlign: 'center',
  },
  focusCell: {
    borderColor: '#000',
  },
});

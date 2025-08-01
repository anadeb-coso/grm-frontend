import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { WebView } from 'react-native-webview';
import { useToast } from 'react-native-toast-notifications';
import { useTranslation } from 'react-i18next';
import { cddBaseURL } from '../../services/env';

const PasswordLoss = ({ navigation }) => {
    const { t } = useTranslation();
    const webViewRef = useRef(null);
    var toast = useToast();

    const handleNavigationChange = (navState) => {
        
        if (navState.url && navState.url.includes('/reset-password-done')) {
            toast.show(t('password_loss'), {
                type: "success",
                placement: "bottom",
                duration: 3000,
            });
            
            navigation.goBack();
            
        }
    };


    return (
        <View style={styles.container}>
            <WebView
                ref={webViewRef}
                source={{ uri: `${cddBaseURL}/reset-password-ask-email/` }}
                style={styles.webview}
                onNavigationStateChange={handleNavigationChange}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    webview: {
        flex: 1,
    },
});

export default PasswordLoss;

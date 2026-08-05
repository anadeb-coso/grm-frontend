import React, { useState, useEffect } from 'react';
import { Snackbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { View, TouchableOpacity } from 'react-native';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Q } from '@nozbe/watermelondb';

import { database } from '../../database';


function SnackBarCheckFileUnsyncComponent() {
    const navigation = useNavigation();
    const { t } = useTranslation();

    const [errorVisible, setErrorVisible] = React.useState(false);
    const [errorMessage, setErrorMessage] = useState(t('files_not_sync_alert_message'));


    const onDismissSnackBar = () => setErrorVisible(false);

    // Simplifié par rapport à la version PouchDB : la table `attachments` WatermelonDB suit déjà
    // explicitement `upload_status` par pièce jointe (cf. database/schema.js), plus besoin de
    // scanner les tableaux imbriqués `issue.attachments[]`/`issue.reasons[]`.
    const get_files = async () => {
        try {
            const pending = await database.get('attachments')
                .query(Q.where('upload_status', Q.notEq('done')))
                .fetch();
            if (pending.length > 0) {
                setErrorMessage(t('files_not_sync_alert_message'));
                setErrorVisible(true);
            }
        } catch (e) {
            console.log("Error1 : " + e);
        }
    };

    useEffect(() => {
        get_files();
    }, []);


    return (
        <Snackbar visible={errorVisible} duration={10000} onDismiss={onDismissSnackBar}
            style={{ backgroundColor: '#e1461c' }}>
            <View style={{ flexDirection: 'row' }}>
                <View style={{ flex: 0.8 }}>
                    <Text style={{color: 'white'}}>{errorMessage}</Text>
                </View>
                <View style={{
                    flex: 0.2, alignContent: 'flex-end', alignItems: 'flex-end'
                }}>
                    <TouchableOpacity onPress={() => navigation.navigate('SyncAttachments')}
                    >
                        <Text style={{color: 'white', fontWeight: 'bold'}} textAlign={'right'}>{t('see')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Snackbar>
    );
}

export default SnackBarCheckFileUnsyncComponent;

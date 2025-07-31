import React, { useState, useEffect } from 'react';
import { Snackbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { View, TouchableOpacity } from 'react-native';
import { Text } from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { getInfoAsync } from 'expo-file-system';

import { LocalGRMDatabase } from '../../utils/databaseManager';


function SnackBarCheckFileUnsyncComponent() {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const { userDocument: eadl } = useSelector((state) => state.get('userDocument').toObject());

    const [errorVisible, setErrorVisible] = React.useState(false);
    const [errorMessage, setErrorMessage] = useState(t('files_not_sync_alert_message'));


    const onDismissSnackBar = () => setErrorVisible(false);

    const get_files = async () => {
        try {

            LocalGRMDatabase.find({
                selector: {
                    type: 'issue',
                    "$or": [
                        {
                            "assignee.id": eadl?.representative?.id
                        },
                        {
                            "reporter.id": eadl?.representative?.id
                        }

                    ]
                },
            }).then(async (res) => {
                let found = false;
                for (let i = 0; i < res.docs.length; i++) {
                    const attachments = res.docs[i]?.attachments;
                    for (let k = 0; k < attachments?.length; k++) {
                        if (attachments[k].uploaded === false && attachments[k].user_id == eadl?.representative?.id && (await getInfoAsync(attachments[k]?.local_url)).exists) {
                            found = true;
                            setErrorMessage(t('files_not_sync_alert_message'));
                            setErrorVisible(true);
                        }
                        break;
                    }
                    if (found) {
                        break;
                    }

                    const reasons = res.docs[i]?.reasons;
                    for (let index = 0; index < reasons?.length; index++) {
                        if (reasons[index].type == 'file' && reasons[index].uploaded === false && reasons[index].user_id == eadl?.representative?.id && (await getInfoAsync(reasons[index]?.local_url)).exists) {
                            found = true;
                            setErrorMessage(t('files_not_sync_alert_message'));
                            setErrorVisible(true);
                        }
                        break;
                    }
                    if (found) {
                        break;
                    }
                }
            });


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
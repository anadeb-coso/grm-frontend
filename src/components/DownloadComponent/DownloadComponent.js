import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';
import * as Progress from 'react-native-progress';
import Share from 'react-native-share';
import { useTranslation } from 'react-i18next';
import { downloadToDownloadsFolder } from '../../utils/functions';
import { colors } from '../../utils/colors';

const DownloadComponent = ({ url, username, password, onlyIcon = false, eye = true }) => {
    const { t } = useTranslation();
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadComplete, setDownloadComplete] = useState(false);

    const handleDownload = async () => {
        try {
            setIsDownloading(true);
            setDownloadProgress(0);
            setDownloadComplete(false);

            await downloadToDownloadsFolder(
                url,
                username,
                password,
                (progress) => {
                    setDownloadProgress(progress);
                }
            );

            setDownloadComplete(true);
        } catch (error) {
            console.error(error);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <View>
            {eye && url && <IconButton
                icon="eye"
                iconColor={colors.primary}
                size={24}
                onPress={async () => {
                    await Share.open({ url: url, });
                }}
            />}
            <View style={styles.container}>

                {onlyIcon ? <IconButton
                    icon="download"
                    iconColor={colors.primary}
                    size={24}
                    onPress={handleDownload}
                    disabled={isDownloading}
                /> : <Button
                    title="Télécharger le fichier"
                    onPress={handleDownload}
                    disabled={isDownloading}
                />}

                {isDownloading && (
                    <View style={styles.progressContainer}>
                        <Progress.Bar
                            progress={downloadProgress}
                            width={200}
                            color="#3498db"
                        />
                        <Text style={styles.progressText}>
                            {Math.round(downloadProgress * 100)}%
                        </Text>
                    </View>
                )}

                {downloadComplete && (
                    onlyIcon ? <IconButton
                        icon="check-circle"
                        iconColor={colors.primary}
                        size={24}
                        onPress={() => {}}
                        style={{marginTop: -20}}
                    /> : <Text style={styles.completeText}>
                        Téléchargement terminé avec succès!
                    </Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        // padding: 20,
        alignItems: 'center',
    },
    progressContainer: {
        // marginTop: 20,
        alignItems: 'center',
    },
    progressText: {
        // marginTop: 5,
    },
    completeText: {
        // marginTop: 10,
        color: 'green',
    },
});

export default DownloadComponent;
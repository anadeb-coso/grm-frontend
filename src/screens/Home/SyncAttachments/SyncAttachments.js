import React, { useState, useEffect } from 'react';
import { View, Platform, Modal, Text } from 'react-native';
import axios from 'axios';
import { ActivityIndicator, Snackbar } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { getInfoAsync, uploadAsync } from 'expo-file-system';
import * as FileSystem from 'expo-file-system';
import { useTranslation } from 'react-i18next';
import LocalDatabase, { LocalGRMDatabase } from '../../../utils/databaseManager';
import { colors } from '../../../utils/colors';
import ImagesList from './components/ImagesList';
import { getEncryptedData } from '../../../utils/storageManager';
import CustomGreenButton from '../../../components/CustomGreenButton/CustomGreenButton';
import SyncImage from '../../../../assets/sync-image.svg';
import CheckCircle from '../../../../assets/check-circle.svg';
import { baseURL } from '../../../services/API';
import { SyncToRemoteDatabase } from "../../../utils/databaseManager";

function SyncAttachments({ navigation }) {
  const { t } = useTranslation();

  const FILE_READ_ERROR = t('file_read_error');
  const FILE_READ_ERROR_TRY_AGAIN = t('file_read_error_try_again');


  const [loading, setLoading] = useState(true);
  const [attachments, setAttachments] = useState([]);
  const [successModal, setSuccessModal] = useState(false);
  const [fetchedContent, setFetchedContent] = useState(false);
  const [errorVisible, setErrorVisible] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState(FILE_READ_ERROR);

  const onDismissSnackBar = () => setErrorVisible(false);

  const { username, userPassword } = useSelector((state) => state.get('authentication').toObject());
  const { userDocument: eadl } = useSelector((state) => state.get('userDocument').toObject());

  const getAndSetAttachments = async () => {
    if (!fetchedContent) {
      async function fetchContent() {
        // LocalDatabase.find({
        //   selector: { 'representative.email': username },
        //   // fields: ["_id", "phases"],
        // })
        //   .then((result) => {
        //     const phases = result?.docs[0]?.phases;
        //     const docId = result?.docs[0]?._id;
        //     const attachmentsArray = [];
        //     for (let i = 0; i < phases.length; i++) {
        //       const phaseOrdinal = phases[i]?.ordinal;
        //       const tasks = phases[i]?.tasks;
        //       for (let j = 0; j < tasks?.length; j++) {
        //         const taskOrdinal = tasks[j]?.ordinal;
        //         const attachments = tasks[j]?.attachments;
        //         for (let k = 0; k < attachments?.length; k++) {
        //           const attachment = attachments[k];
        //           attachmentsArray.push({
        //             attachment,
        //             phaseOrdinal,
        //             taskOrdinal,
        //             docId,
        //           });
        //         }
        //       }
        //     }

        //     // fetch EADL
        //     const issuesAttachments = [];
        //     const eadl = result;
        //     // LocalDatabase.find({
        //     //   selector: { 'representative.email': username },
        //     //   // fields: ["_id", "commune", "phases"],
        //     // })
        //     //   .then((eadl) => {
        //         // FETCH GRM ISSUES
        //         LocalGRMDatabase.find({
        //           selector: {
        //             type: 'issue',
        //             // 'reporter.id': eadl.docs[0].representative.id,
        //             'assignee.id': eadl.docs[0].representative.id,
        //             // "$or": [
        //             //   {
        //             //     "reporter.id": eadl.docs[0].representative.id
        //             //   },
        //             //   {
        //             //     "assignee.id": eadl.docs[0].representative.id
        //             //   }
        //             // ]
        //           },
        //         }).then((res) => {
        //           for (let i = 0; i < res.docs.length; i++) {
        //             const attachments = res.docs[i]?.attachments;
        //             for (let k = 0; k < attachments?.length; k++) {
        //               issuesAttachments.push({
        //                 attachment: attachments[k],
        //                 docId: res?.docs[i]?._id,
        //               });
        //             }

        //             const reasons = res.docs[i]?.reasons;
        //             for (let index = 0; index < reasons?.length; index++) {
        //               issuesAttachments.push({
        //                 attachment: reasons[index],
        //                 docId: res?.docs[i]?._id,
        //               });
        //             }

        //             // console.log(res.docs[i].attachments)
        //           }
        //           setAttachments([...attachmentsArray.flat(2), ...issuesAttachments]);
        //           setLoading(false);
        //         });

        //         // handle result
        //       // })
        //       // .catch((err) => {
        //       //   setLoading(false);
        //       // });

        //     // handle result
        //   })
        //   .catch((err) => {
        //     setLoading(false);
        //   });



        const attachmentsArray = [];
        const issuesAttachments = [];
        LocalGRMDatabase.find({
          selector: {
            type: 'issue',
            // 'reporter.id': eadl.docs[0].representative.id,
            // 'assignee.id': eadl.representative.id,
            "$or": [
              {
                "assignee.id": eadl.representative.id
              },
              {
                "reporter.id": eadl.representative.id
              }
                
            ]
            // "$or": [
            //   {
            //     "reporter.id": eadl.docs[0].representative.id
            //   },
            //   {
            //     "assignee.id": eadl.docs[0].representative.id
            //   }
            // ]
          },
        }).then((res) => {
          for (let i = 0; i < res.docs.length; i++) {
            const attachments = res.docs[i]?.attachments;
            for (let k = 0; k < attachments?.length; k++) {
              if(attachments[k].user_id == eadl.representative.id){
                issuesAttachments.push({
                  attachment: attachments[k],
                  docId: res?.docs[i]?._id,
                });
              }
            }

            const reasons = res.docs[i]?.reasons;
            for (let index = 0; index < reasons?.length; index++) {
              if(reasons[index].user_id == eadl.representative.id){
                issuesAttachments.push({
                  attachment: reasons[index],
                  docId: res?.docs[i]?._id,
                });
              }
            }

            // console.log(res.docs[i].attachments)
          }
          setAttachments([...attachmentsArray.flat(2), ...issuesAttachments]);
          setLoading(false);
        });

        setLoading(false);
      }
      setLoading(true);
      await fetchContent();
    }
  };
  useEffect(() => {
    getAndSetAttachments();
  }, []);

  const uploadFile = async (file, dbConfig) => {
    try {
      const tmp = await getInfoAsync(file?.attachment?.local_url);
      if (tmp.exists) {
        // const formData = new FormData();
        // formData.append('username', dbConfig?.username);
        // formData.append('password', dbConfig?.password);
        // formData.append('doc_id', file?.docId);
        // formData.append('phase', file?.phaseOrdinal);
        // formData.append('task', file?.taskOrdinal);
        // formData.append('attachment_id', file?.attachment?.id);
        // formData.append('file', {
        //   uri:
        //     Platform.OS === 'android'
        //       ? file?.attachment?.local_url
        //       : file?.attachment?.local_url.replace('file://', ''),
        //   name: file?.attachment?.name,
        //   type: 
        //     file.attachment?.isAudio ? 
        //       'audio/m4a' 
        //     : (file?.attachment?.local_url.includes('.pdf') ? 'application/pdf' : 'image/*'), //'image/jpeg' // it may be necessary in Android.
        // });

        // await axios.post(
        //   `${baseURL}${
        //     file.taskOrdinal ? '/attachments/upload-to-task' : '/attachments/upload-to-issue'
        //   }`,
        //   formData,
        //   { 'Content-Type': 'multipart/form-data' }
        // );
        // return {};





        try {
          const response = await uploadAsync(
            `${baseURL}${file.taskOrdinal ? '/attachments/upload-to-task' : '/attachments/upload-to-issue'
            }`,
            Platform.OS === 'android'
              ? file?.attachment?.local_url
              : file?.attachment?.local_url.replace('file://', ''),
            {
              fieldName: 'file',
              httpMethod: 'POST',
              uploadType: FileSystem.FileSystemUploadType.MULTIPART,
              ContentType: 'multipart/form-data',
              mimeType:
                file.attachment?.isAudio ?
                  'audio/m4a'
                  : (file?.attachment?.local_url.includes('.pdf') ? 'application/pdf' : 'image/*'),
              parameters: {
                username: dbConfig?.username,
                password: dbConfig?.password,
                doc_id: file?.docId,
                phase: file?.phaseOrdinal,
                task: file?.taskOrdinal,
                attachment_id: file?.attachment?.id
              },
            },
          );
          // console.log(response);
          if (response.status < 300) {
            return {};
          }

        } catch (e) {
          setErrorMessage(FILE_READ_ERROR);
          setErrorVisible(true);
          return { error: FILE_READ_ERROR };
        }

      }
      setErrorMessage(FILE_READ_ERROR);
      setErrorVisible(true);
      return { error: FILE_READ_ERROR };
    } catch (e) {
      console.log(e);
      setErrorMessage(FILE_READ_ERROR_TRY_AGAIN);
      setErrorVisible(true);
      return { error: FILE_READ_ERROR_TRY_AGAIN };
    }
  };

  const syncImages = async () => {
    const dbConfig = await getEncryptedData(
      `dbCredentials_${userPassword}_${username.replace('@', '')}`
    );
    setLoading(true);
    let isError = false;
    for (let i = 0; i < attachments.length; i++) {
      if (attachments[i]?.attachment?.uploaded === false) {
        const response = await uploadFile(attachments[i], dbConfig);
        if (response.error) isError = true;
      }
    }
    setLoading(false);
    if (!isError) setSuccessModal(true);

    await SyncToRemoteDatabase(dbConfig, username);
    await getAndSetAttachments();
  };
  return (
    <View style={{ flex: 1 }}>
      <Modal animationType="slide" style={{ flex: 1 }} visible={successModal}>
        <View
          style={{
            flex: 1,
            padding: 20,
            alignItems: 'center',
            justifyContent: 'space-around',
          }}
        >
          <View style={{ alignItems: 'center', marginTop: '20%' }}>
            <CheckCircle />
            <Text
              style={{
                marginVertical: 25,
                fontFamily: 'Poppins_700Bold',
                fontSize: 20,
                fontWeight: 'bold',
                fontStyle: 'normal',
                lineHeight: 25,
                letterSpacing: 0,
                textAlign: 'center',
                color: '#707070',
              }}
            >
              Synchronisation {'\n'} Réussie!
            </Text>
          </View>
          <SyncImage />
          <CustomGreenButton
            onPress={() => navigation.goBack()}
            buttonStyle={{
              width: '100%',
              height: 36,
              borderRadius: 7,
            }}
            textStyle={{
              fontFamily: 'Poppins_500Medium',
              fontSize: 14,
              lineHeight: 21,
              letterSpacing: 0,
              textAlign: 'right',
              color: '#ffffff',
            }}
          >
            DONE
          </CustomGreenButton>
        </View>
      </Modal>
      <ImagesList attachments={attachments} />
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 10 }} />
      ) : (
        <View>
          <CustomGreenButton
            onPress={syncImages}
            buttonStyle={{
              height: 36,
              borderRadius: 7,
              marginHorizontal: '5%',
              width: '90%',
              marginBottom: 10,
            }}
            textStyle={{
              fontFamily: 'Poppins_500Medium',
              fontSize: 14,
              lineHeight: 21,
              letterSpacing: 0,
              textAlign: 'right',
              color: '#ffffff',
            }}
          >
            Sync
          </CustomGreenButton>
        </View>
      )}
      <Snackbar visible={errorVisible} duration={3000} onDismiss={onDismissSnackBar}>
        {errorMessage}
      </Snackbar>
    </View>
  );
}

export default SyncAttachments;

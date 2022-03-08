import React, { useState, useEffect } from "react";
import { View, Platform, Modal, Text } from "react-native";
import axios from "axios";
import { ActivityIndicator } from "react-native-paper";
import LocalDatabase, {
  LocalGRMDatabase,
} from "../../../utils/databaseManager";
import { useSelector } from "react-redux";
import { colors } from "../../../utils/colors";
import ImagesList from "./components/ImagesList";
import { getEncryptedData } from "../../../utils/storageManager";
import CustomGreenButton from "../../../components/CustomGreenButton/CustomGreenButton";
import SyncImage from "../../../../assets/sync-image.svg";
import CheckCircle from "../../../../assets/check-circle.svg";
import { getInfoAsync } from "expo-file-system";

const SyncAttachments = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [attachments, setAttachments] = useState([]);
  const [successModal, setSuccessModal] = useState(false);
  const [fetchedContent, setFetchedContent] = useState(false);
  const { username, userPassword } = useSelector((state) => {
    return state.get("authentication").toObject();
  });
  const uploadFile = async (file, dbConfig) => {
    let tmp = await getInfoAsync(file?.attachment?.local_url);
    if (tmp.exists) {
      const formData = new FormData();

      formData.append("username", dbConfig?.username);
      formData.append("password", dbConfig?.password);
      formData.append("doc_id", file?.docId);
      formData.append("phase", file?.phaseOrdinal);
      formData.append("task", file?.taskOrdinal);
      formData.append("attachment_id", file?.attachment?.id);
      formData.append("file", {
        uri:
          Platform.OS === "android"
            ? file?.attachment?.local_url
            : file?.attachment?.local_url.replace("file://", ""),
        name: `image 2.png`,
        type: "image/jpeg", // it may be necessary in Android.
      });

      await axios.post(
        `https://grm-6u3m7.ondigitalocean.app${
          file.taskOrdinal
            ? "/attachments/upload-to-task"
            : "/attachments/upload-to-issue"
        }`,
        formData,
        { "Content-Type": "multipart/form-data" }
      );
    } else {
      return alert("File does not exists");
    }
  };
  const syncImages = async () => {
    const dbConfig = await getEncryptedData(
      `dbCredentials_${userPassword}_${username.replace("@", "")}`
    );
    setLoading(true);
    for (let i = 0; i < attachments.length; i++) {
      if (attachments[i]?.attachment?.uploaded === false) {
        try {
          await uploadFile(attachments[i], dbConfig);
        } catch (e) {
          setLoading(false);
        }
      }
    }
    setLoading(false);
    setSuccessModal(true);
  };
  useEffect(() => {
    if (!fetchedContent) {
      async function fetchContent() {
        LocalDatabase.find({
          selector: { "representative.email": username },
          // fields: ["_id", "phases"],
        })
          .then(function (result) {
            const phases = result?.docs[0]?.phases;
            const docId = result?.docs[0]?._id;
            let attachmentsArray = [];
            for (let i = 0; i < phases.length; i++) {
              let phaseOrdinal = phases[i]?.ordinal;
              let tasks = phases[i]?.tasks;
              for (let j = 0; j < tasks?.length; j++) {
                let taskOrdinal = tasks[j]?.ordinal;
                let attachments = tasks[j]?.attachments;
                for (let k = 0; k < attachments?.length; k++) {
                  let attachment = attachments[k];
                  attachmentsArray.push({
                    attachment,
                    phaseOrdinal,
                    taskOrdinal,
                    docId,
                  });
                }
              }
            }

            //fetch EADL
            let issuesAttachments = [];
            LocalDatabase.find({
              selector: { "representative.email": username },
              // fields: ["_id", "commune", "phases"],
            })
              .then(function (result) {
                //FETCH GRM ISSUES
                LocalGRMDatabase.find({
                  selector: {
                    type: "issue",
                    "reporter.name": result.docs[0].representative.name,
                  },
                }).then((res) => {
                  for (let i = 0; i < res.docs.length; i++) {
                    let attachments = res.docs[i]?.attachments;
                    for (let k = 0; k < attachments?.length; k++) {
                      issuesAttachments.push({
                        attachment: attachments[k],
                        docId: res?.docs[i]?._id,
                      });
                    }
                    // console.log(res.docs[i].attachments)
                  }
                  setAttachments([
                    ...attachmentsArray.flat(2),
                    ...issuesAttachments,
                  ]);
                  setLoading(false);
                });

                // handle result
              })
              .catch(function (err) {
                setLoading(false);
                console.log(err);
              });

            // handle result
          })
          .catch(function (err) {
            setLoading(false);
            console.log(err);
          });
      }
      fetchContent();
    }
  }, []);
  return (
    <View style={{ flex: 1 }}>
      <Modal animationType="slide" style={{ flex: 1 }} visible={successModal}>
        <View
          style={{
            flex: 1,
            padding: 20,
            alignItems: "center",
            justifyContent: "space-around",
          }}
        >
          <View style={{ alignItems: "center", marginTop: "20%" }}>
            <CheckCircle />
            <Text
              style={{
                marginVertical: 25,
                fontFamily: "Poppins_700Bold",
                fontSize: 20,
                fontWeight: "bold",
                fontStyle: "normal",
                lineHeight: 25,
                letterSpacing: 0,
                textAlign: "center",
                color: "#707070",
              }}
            >
              Synchronization {"\n"} Successful!
            </Text>
          </View>
          <SyncImage />
          <CustomGreenButton
            onPress={() => navigation.goBack()}
            buttonStyle={{
              width: "100%",
              height: 36,
              borderRadius: 7,
            }}
            textStyle={{
              fontFamily: "Poppins_500Medium",
              fontSize: 14,
              lineHeight: 21,
              letterSpacing: 0,
              textAlign: "right",
              color: "#ffffff",
            }}
          >
            DONE
          </CustomGreenButton>
        </View>
      </Modal>
      <ImagesList attachments={attachments} />
      {loading ? (
        <ActivityIndicator
          color={colors.primary}
          style={{ marginVertical: 10 }}
        />
      ) : (
        <View>
          <CustomGreenButton
            onPress={syncImages}
            buttonStyle={{
              height: 36,
              borderRadius: 7,
              marginHorizontal: "5%",
              width: "90%",
              marginBottom: 10,
            }}
            textStyle={{
              fontFamily: "Poppins_500Medium",
              fontSize: 14,
              lineHeight: 21,
              letterSpacing: 0,
              textAlign: "right",
              color: "#ffffff",
            }}
          >
            Sync
          </CustomGreenButton>
        </View>
      )}
    </View>
  );
};

export default SyncAttachments;

import * as FileSystem from 'expo-file-system';
// import * as Sharing from "expo-sharing";
import Share from 'react-native-share';

export const showFile = async (uri) => {

    // if (uri.includes("file://")) {
      const buff = Buffer.from(uri, "base64");
      const base64 = buff.toString("base64");
    //   const fileUri = FileSystem.documentDirectory + `${encodeURI(selectedAttachment.name ? selectedAttachment.name : "pdf")}.pdf`;
    const fileUri = uri;
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Sharing.shareAsync(uri);
      await Share.open({ url: uri, });

    // } else {
    //   openUrl(uri.split("?")[0]);
    // }


  }
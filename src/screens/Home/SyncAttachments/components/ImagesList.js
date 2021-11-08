import React, { useEffect, useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { ActivityIndicator, Card } from "react-native-paper";
import { colors } from "../../../../utils/colors";

const ImagesList = ({ attachments }) => {
  const [_attachments, _setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const AttachmentComponent = ({ attachment }) => {
    return (
      <View
        key={attachment.id}
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginVertical: 10,
          // justifyContent: 'space-around'
        }}
      >
        <Image
          style={{
            width: 57,
            height: 57,
            borderRadius: 10,
            marginHorizontal: 21,
          }}
          source={{
            uri: attachment?.attachment?.local_url,
          }}
        />
        <Card
          style={{
            borderRadius: 10,
            backgroundColor: "#ffffff",
            flex: 1,
            padding: 10,
            marginRight: 21,
            marginVertical: 5,
          }}
        >
          <Text
            style={{
              fontFamily: "Poppins_400Regular",
              fontSize: 13,
              fontWeight: "normal",
              fontStyle: "normal",
              lineHeight: 16,
              letterSpacing: 0,
              textAlign: "left",
              color: "#707070",
            }}
          >
            {!attachment.taskOrdinal &&
              `Fichier appartenant à un problème${
                attachment?.attachment?.isAudio ? " [Audio Recording]" : "."
              }`}
            {attachment.taskOrdinal &&
              `Attachment on task ${attachment?.taskOrdinal} of \n phase ${attachment?.phaseOrdinal}`}
          </Text>
        </Card>
      </View>
    );
  };
  useEffect(() => {
    setTimeout(() => {
      attachments?.length > 0 &&
        _setAttachments(
          attachments.map(
            (obj) =>
              obj?.attachment?.uploaded === false && (
                <AttachmentComponent attachment={obj} />
              )
          )
        );
      setLoading(false);
    }, 500);
  }, [attachments]);
  if (loading)
    return (
      <View style={{ flex: 1 }}>
        <ActivityIndicator style={{ marginTop: 100 }} color={colors.primary} />
      </View>
    );
  return <ScrollView>{_attachments}</ScrollView>;
};

export default React.memo(ImagesList);

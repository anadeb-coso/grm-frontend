import React from "react";
import { ImageBackground, Dimensions, View } from "react-native";
import { Card, Headline } from "react-native-paper";
import RightChevron from "../../../../../assets/right-chevron.svg";
const screenWidth = Dimensions.get("window").width;

function BigCard({ onCardPress, image, title, icon, cardHeight = 123 }) {
  return (
    <Card
      onPress={onCardPress}
      style={{
        width: screenWidth * 0.888,
        height: cardHeight,
        alignSelf: "center",
        borderRadius: 15,
      }}
    >
      <ImageBackground
        source={image}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 15,
          overflow: "hidden",
          flexDirection: "row",
        }}
      >
        <Headline
          style={{
            fontSize: 20,
            fontFamily: "Poppins_700Bold",
            fontWeight: "bold",
            fontStyle: "normal",
            lineHeight: 21,
            letterSpacing: 0,
            textAlign: "left",
            color: "#ffffff",
            marginLeft: 14,
            marginTop: 14,
            flex: 1,
          }}
        >
          {title}
        </Headline>
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            justifyContent: "flex-end",
            alignItems: "flex-end",
          }}
        >
          {icon}
          <View
            style={{
              marginRight: 15,
              marginBottom: cardHeight !== 123 ? 0 : 15,
              alignSelf: cardHeight !== 123 ? "center" : null,
            }}
          >
            <RightChevron height={27} width={27} />
          </View>
        </View>
      </ImageBackground>
    </Card>
  );
}

export default BigCard;

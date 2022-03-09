import React from "react";
import {
  View,
  ScrollView,
  Dimensions,
  ImageBackground,
  Image,
} from "react-native";
const screenWidth = Dimensions.get("window").width;
import { useNavigation } from "@react-navigation/native";
import SmallCard from "../components/SmallCard";
import BigCard from "../components/BigCard";
import Chart from "../../../../../assets/chart_line_solid.svg";
import FileIcon from "../../../../../assets/file_alt_regular.svg";
import TeamWorkIcon from "../../../../../assets/team-work.svg";
import SyncIcon from "../../../../../assets/sync_alt_solid.svg";

function Content() {
  const navigation = useNavigation();
  return (
    <ScrollView style={{ backgroundColor: "white" }}>
      <ImageBackground
        style={{
          width: screenWidth,
          height: 120.4,
          justifyContent: "flex-end",
          alignItems: "flex-end",
          backgroundColor: "white",
        }}
        source={require("../../../../../assets/drawable-xhdpi/group_8043.png")}
      >
        <View>
          <Image
            style={{ height: 70, width: 180 }}
            resizeMode={"contain"}
            source={require("../../../../../assets/drawable-xhdpi/group_2.png")}
          />
        </View>
      </ImageBackground>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-evenly",
          marginVertical: 20,
          borderRadius: 15,
        }}
      >
        <SmallCard
          image={require("../../../../../assets/BG_1.png")}
          onCardPress={() => alert("Upcoming feature")}
          title={"PAI"}
          icon={<Chart />}
        />
        <SmallCard
          image={require("../../../../../assets/BG_2.png")}
          onCardPress={() => alert("Upcoming feature")}
          title={"Apprendre \n" + "et actualités"}
          icon={<FileIcon />}
        />
      </View>
      <BigCard
        image={require("../../../../../assets/BG_9.png")}
        onCardPress={() => navigation.navigate("CitizenEngagement")}
        title={"Mécanisme d’engagement des citoyens"}
        icon={<TeamWorkIcon />}
      />
      <View style={{ marginVertical: 20 }}>
        <BigCard
          image={require("../../../../../assets/small-rectangle.png")}
          onCardPress={() => navigation.navigate("SyncAttachments")}
          title={"Sync Files"}
          icon={<SyncIcon />}
          cardHeight={79}
        />
      </View>

      {/*<ReactNativeSwipeableViewStack*/}
      {/*  // onSwipe={(swipedIndex) => this.onCardSwipe(swipedIndex)}*/}
      {/*  initialSelectedIndex={1}*/}
      {/*  data={[0, 1, 2, 3, 4, 5]}*/}
      {/*  useNativeDrive={true}*/}
      {/*  stackSpacing={Platform.OS === "ios" ? 30 : 20}*/}
      {/*  onItemClicked={() => console.log("click")}*/}
      {/*  pointerEvents="none"*/}
      {/*  renderItem={(element) => (*/}
      {/*    <Card*/}
      {/*      pointerEvents="none"*/}
      {/*      style={{*/}
      {/*        width: screenWidth * 0.888,*/}
      {/*        alignSelf: "center",*/}
      {/*        borderRadius: 15,*/}
      {/*        backgroundColor: "white",*/}
      {/*        padding: 19,*/}
      {/*      }}*/}
      {/*    >*/}
      {/*      <Headline*/}
      {/*        style={{*/}
      {/*          color: "#707070",*/}
      {/*          fontWeight: "500",*/}
      {/*        }}*/}
      {/*      >*/}
      {/*        Prochaine tâche*/}
      {/*      </Headline>*/}
      {/*      <Paragraph*/}
      {/*        style={{*/}
      {/*          color: "#707070",*/}
      {/*        }}*/}
      {/*      >*/}
      {/*        Lorem Ipsum is simply dummy text of the printing and typesetting*/}
      {/*        industry. Lorem Ipsum has been the industry’s standard dummy text*/}
      {/*        ever since the 1500s.*/}
      {/*      </Paragraph>*/}
      {/*      <Button*/}
      {/*        onPress={() => alert("hey")}*/}
      {/*        style={{*/}
      {/*          alignSelf: "flex-end",*/}
      {/*          backgroundColor: "#24c38b",*/}
      {/*          width: 115,*/}
      {/*          marginTop: 20,*/}
      {/*          borderRadius: 7,*/}
      {/*          padding: 5,*/}
      {/*        }}*/}
      {/*        labelStyle={{*/}
      {/*          color: "white",*/}
      {/*        }} */}
      {/*      >*/}
      {/*        Tâches*/}
      {/*      </Button>*/}
      {/*    </Card>*/}
      {/*  )}*/}
      {/*/>*/}
    </ScrollView>
  );
}

export default Content;

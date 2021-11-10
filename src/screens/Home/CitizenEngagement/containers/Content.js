import React from "react";
import { View, FlatList } from "react-native";
import BigCard from "../../Dashboard/components/BigCard";
import { useNavigation } from "@react-navigation/native";

const DATA = [
  {
    id: "bd7acbea-c1b1-46c2-aed5-3ad53abb28ba",
    title: "Budget\n" + "Participatif",
    background: require("../../../../../assets/greenBg.png"),
    navigateTo: "ParticipatoryBudgetingList",
  },
  {
    id: "3ac68afc-c605-48d3-a4f8-fbd91aa97f63",
    title: "GRM",
    background: require("../../../../../assets/orangeBg.png"),
    navigateTo: "GRM",
  },
  {
    id: "58694a0f-3da1-471f-bd96-145571e29d72",
    title: "Participatif\n" + "surveillance",
    background: require("../../../../../assets/yellowBg.png"),
  },
  {
    id: "58694a0f-3da1-471f-bd96-1454235f9d72",
    title: "Diagnostics participatifs",
    background: require("../../../../../assets/purpleBg.png"),
  },
];

function Content() {
  const navigation = useNavigation();
  return (
    <FlatList
      removeClippedSubviews
      data={DATA}
      renderItem={({ item }) => (
        <View style={{ marginVertical: 10 }}>
          <BigCard
            image={item.background}
            onCardPress={() =>
              navigation.navigate(item.navigateTo || "WorkInProgress")
            }
            title={item.title}
            // icon={<TeamWorkIcon />}
          />
        </View>
      )}
    />
  );
}

export default Content;

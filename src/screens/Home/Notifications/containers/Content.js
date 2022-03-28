import React, { useState } from "react";
import UpdatableList from "../../../../components/UpdatableList";
import { styles } from "./Content.style";
import NotificationItem from "../components/NotificationItem";
import { SafeAreaView, View } from "react-native";
import { Text } from "react-native-paper";
import { colors } from "../../../../utils/colors";
const randomRange = (min, max) => Math.floor(Math.random() * (max - min)) + min;

const generateMockData = (amount) => {
  let data = [];
  for (let i = 0; i < amount; i++) {
    const id = randomRange(0, 2000);
    const logo = randomRange(0, 3);
    const isRead = randomRange(0, 2);
    data.push({
      title:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
      logo: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Eo_circle_indigo_letter-j.svg/600px-Eo_circle_indigo_letter-j.svg.png",
        "https://www.fluentu.com/blog/wp-content/uploads/2018/07/language-audio-books-2-1.png",
        "https://www.vhv.rs/dpng/d/1-11823_circle-location-icon-png-transparent-png.png",
      ][logo],
      id,
      isRead: !!isRead,
      date: "03/29/2020",
      hour: "2:48pm",
    });
  }
  return data;
};

const Content = () => {
  const [data, setData] = useState(generateMockData(10));
  const removeText = (item) => {
    setData(data.filter((_item) => _item.id !== item.id));
  };
  const onRead = (item) => {
    const foundIndex = data.findIndex((x) => x.id === item.id);
    const updatedData = data.slice();
    item.isRead = true;
    updatedData[foundIndex] = item;
    setData(updatedData);
  };

  const handleFetchMoreData = async () => {
    try {
      await new Promise((res, _rej) => {
        const tout = setTimeout(() => {
          clearTimeout(tout);
          res();
        }, 1000);
      });
      setData((d) => d.concat(generateMockData(10)));
    } catch (error) {
    } finally {
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ justifyContent: "center", alignItems: "center", flex: 1 }}>
        <Text style={{ color: colors.primary, fontWeight: "bold" }}>
          Upcoming feature.
        </Text>
      </View>
    </SafeAreaView>
  );

  // return (
  //   <UpdatableList
  //     onFetchMoreData={handleFetchMoreData}
  //     contentContainerStyle={styles.listContent}
  //     data={data}
  //     keyExtractor={(_, i) => `item-${i}`}
  //     renderItem={({ item }) => (
  //       <NotificationItem
  //         {...item}
  //         onRead={() => onRead(item)}
  //         onRemovePress={() => removeText(item)}
  //       />
  //     )}
  //   />
  // );
};

export default Content;

import React, { useRef, useState } from "react";
import { FlatList, View, ActivityIndicator } from "react-native";
import { styles } from "./UpdatableList.style";

const UpdatableList = ({
  data,
  keyExtractor,
  renderItem,
  onFetchMoreData,
  contentContainerStyle,
  ...moreProps
}) => {
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

  const nextPage = async () => {
    try {
      setLoading(true);
      await onFetchMoreData();
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleEndReached = () => {
    if (!loading) {
      flatListRef.current?.scrollToEnd();
      nextPage();
    }
  };

  return (
    <FlatList
      {...moreProps}
      ref={flatListRef}
      style={styles.list}
      contentContainerStyle={[styles.listContent, contentContainerStyle]}
      data={data}
      keyExtractor={keyExtractor}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.1}
      ListFooterComponent={<FooterLoader {...{ loading }} />}
      renderItem={renderItem}
      // bounces={false}
    />
  );
};

const FooterLoader = ({ loading, onLayout }) => {
  return (
    <View onLayout={onLayout} style={styles.footerLoader}>
      {loading && <ActivityIndicator size="small" color="#24c38b" />}
    </View>
  );
};

export default UpdatableList;

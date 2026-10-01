import React, { useCallback, useState } from "react";
import { FlatList, RefreshControl, SafeAreaView, View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { styles } from "./Content.style";
import InternetCreditNotificationItem from "../components/InternetCreditNotificationItem";
import { useInternetCreditNotifications } from "../../../../database/internetCredits";
import { runSyncSafely } from "../../../../database/watermelonSyncManager";
import { colors } from "../../../../utils/colors";

/** Espace « Notifications » : confirmations de réception du forfait internet CVGP en attente. */
const Content = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { loading, items } = useInternetCreditNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await runSyncSafely();
    } finally {
      setRefreshing(false);
    }
  }, []);

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} size="large" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        contentContainerStyle={items.length ? undefined : styles.emptyContainer}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t("no_notifications")}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <InternetCreditNotificationItem
            notification={item}
            onPress={() => navigation.navigate("InternetCreditConfirmation", { beneficiaryId: item.id })}
          />
        )}
      />
    </SafeAreaView>
  );
};

export default Content;

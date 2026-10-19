import React, { useCallback, useState } from "react";
import { RefreshControl, SafeAreaView, SectionList, View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { styles } from "./Content.style";
import CommentNotificationItem from "../components/CommentNotificationItem";
import InternetCreditNotificationItem from "../components/InternetCreditNotificationItem";
import { useInternetCreditNotifications } from "../../../../database/internetCredits";
import { useCommentNotifications } from "../../../../database/issueNotifications";
import { runSyncSafely } from "../../../../database/watermelonSyncManager";
import { colors } from "../../../../utils/colors";

/**
 * Espace « Notifications » : issues commentées (commentaires et non lus, cf.
 * database/issueNotifications.js) et confirmations de réception du forfait internet CVGP en attente.
 */
const Content = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { loading: creditsLoading, items: creditItems } = useInternetCreditNotifications();
  const { loading: commentsLoading, items: commentItems } = useCommentNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await runSyncSafely();
    } finally {
      setRefreshing(false);
    }
  }, []);

  if (creditsLoading || commentsLoading) {
    return <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} size="large" />;
  }

  const sections = [
    { key: "comments", title: t("comment_notifications_section"), data: commentItems },
    { key: "internet_credits", title: t("internet_credit_notifications_section"), data: creditItems },
  ].filter((section) => section.data.length > 0);

  return (
    <SafeAreaView style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => `${item.issueId || item.id}_${index}`}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        contentContainerStyle={sections.length ? undefined : styles.emptyContainer}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t("no_notifications")}</Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 4, fontFamily: "Poppins_500Medium", color: "#373737", backgroundColor: "#f5f5f5" }}>
            {section.title}
          </Text>
        )}
        renderItem={({ item, section }) => (section.key === "comments" ? (
          <CommentNotificationItem
            notification={item}
            onPress={() => navigation.navigate("IssueComments", { issueId: item.issueId, issueCode: item.issueCode })}
          />
        ) : (
          <InternetCreditNotificationItem
            notification={item}
            onPress={() => navigation.navigate("InternetCreditConfirmation", { beneficiaryId: item.id })}
          />
        ))}
      />
    </SafeAreaView>
  );
};

export default Content;

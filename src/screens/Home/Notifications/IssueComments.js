import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ActivityIndicator, Button, HelperText } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { database } from '../../../database';
import {
  loadIssueComments, loadUnreadCommentIds, markIssueNotificationsRead,
} from '../../../database/issueNotifications';
import CommentComposer from '../../../components/IssueComments/CommentComposer';
import IssueCommentsList from '../../../components/IssueComments/IssueCommentsList';
import { toLegacyIssueShape } from '../../../utils/issueLegacyShape';
import { colors } from '../../../utils/colors';

/**
 * Commentaires d'une issue ouverts depuis l'espace Notifications : non lus mis en évidence (puis
 * marqués lus), saisie d'un nouveau commentaire et accès direct à l'issue.
 */
function IssueComments({ route, navigation }) {
  const { t } = useTranslation();
  const { issueId, issueCode } = route.params;
  const [issueRecord, setIssueRecord] = useState(undefined);
  const [comments, setComments] = useState(null);
  const [unreadIds, setUnreadIds] = useState(new Set());
  const [opening, setOpening] = useState(false);

  const loadComments = useCallback(async () => {
    setComments(await loadIssueComments(issueId));
  }, [issueId]);

  useEffect(() => {
    navigation.setOptions({ headerTitle: issueCode || t('comments_section_title') });
  }, [navigation, issueCode, t]);

  useEffect(() => {
    let active = true;
    (async () => {
      const [record, unread] = await Promise.all([
        database.get('issues').find(issueId).catch(() => null),
        loadUnreadCommentIds(issueId),
      ]);
      if (!active) return;
      setIssueRecord(record);
      setUnreadIds(unread);
      await markIssueNotificationsRead(issueId);
    })();
    loadComments();
    const subscription = database.withChangesForTables(['comments']).subscribe(() => loadComments());
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [issueId, loadComments]);

  const goToIssue = async () => {
    if (!issueRecord) return;
    setOpening(true);
    try {
      const item = await toLegacyIssueShape(issueRecord);
      navigation.navigate('Dashboard', { screen: 'IssueDetailTabs', params: { item, merge: true } });
    } finally {
      setOpening(false);
    }
  };

  if (comments === null || issueRecord === undefined) {
    return <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} size="large" />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.issueCard}>
        <Text style={styles.code}>{issueRecord?.internalCode || issueCode}</Text>
        {!!issueRecord?.description && (
          <Text style={styles.description} numberOfLines={3}>
            {issueRecord.description.includes("b'") ? '***' : issueRecord.description}
          </Text>
        )}
        <Button
          mode="contained"
          icon="arrow-right"
          buttonColor={colors.primary}
          labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
          style={{ marginTop: 10, alignSelf: 'flex-start' }}
          disabled={!issueRecord}
          loading={opening}
          onPress={goToIssue}
        >
          {t('see_issue')}
        </Button>
        {!issueRecord && <HelperText type="info" visible>{t('issue_not_on_device')}</HelperText>}
      </View>

      <Text style={styles.title}>{t('comments_section_title')}</Text>
      {!!issueRecord && <CommentComposer issueId={issueId} onSubmitted={loadComments} />}
      <IssueCommentsList comments={comments} unreadIds={unreadIds} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, backgroundColor: 'white', flexGrow: 1 },
  issueCard: {
    padding: 14, borderRadius: 10, backgroundColor: 'rgba(36,195,139,0.08)', marginBottom: 16,
  },
  code: { fontFamily: 'Poppins_500Medium', fontSize: 15, color: '#373737' },
  description: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#707070', marginTop: 4 },
  title: { fontFamily: 'Poppins_500Medium', fontSize: 16, color: '#373737', marginTop: 6 },
});

export default IssueComments;

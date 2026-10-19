import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { Divider } from 'react-native-paper';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import { styles } from './Content.styles';
import { database } from '../../../../database';
import { runSyncSafely } from '../../../../database/watermelonSyncManager';
import {
  loadIssueComments, loadUnreadCommentIds, markIssueNotificationsRead,
} from '../../../../database/issueNotifications';
import CommentComposer from '../../../../components/IssueComments/CommentComposer';
import IssueCommentsList from '../../../../components/IssueComments/IssueCommentsList';

function Content({ issue }) {
  const { t } = useTranslation();
  const [statusStories, setStatusStories] = useState();
  const [comments, setComments] = useState([]);
  const [unreadIds, setUnreadIds] = useState(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const issueId = issue.record.id;

  // L'historique de l'issue vient de `issue_status_stories` (table enfant WatermelonDB, ex
  // `issue.issue_status_stories[]` CouchDB). Les commentaires des utilisateurs sont affichés à
  // part, en dessous (section « Commentaires »). `issue.record` porte la référence au vrai
  // enregistrement WatermelonDB (cf. src/utils/issueLegacyShape.js).
  const loadStatusStories = async () => {
    const storyRecords = await issue.record.statusStories.fetch();
    storyRecords.sort((a, b) => (b.datetime?.getTime() || 0) - (a.datetime?.getTime() || 0));
    const withStatusNames = await Promise.all(storyRecords.map(async (s) => {
      const status = s.statusId ? await s.status.fetch() : null;
      return {
        status_name: status?.name,
        user_full_name: s.userFullName,
        comment: s.comment,
        datetime: s.datetime,
      };
    }));
    setStatusStories(withStatusNames);
  };

  const loadComments = useCallback(async () => {
    setComments(await loadIssueComments(issueId));
  }, [issueId]);

  const renderItem = ({ item, index }) => (
    <View key={index} style={styles.commentCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
        <View style={styles.greenCircle} />
        <View>
          <Text style={styles.radioLabel}>{item.status_name}</Text>
          <Text style={styles.radioLabel}>{moment(item.datetime).format('DD-MMM-YYYY')}</Text>
        </View>
      </View>
      {!!item.user_full_name && <Text style={styles.stepNote}>{item.user_full_name}</Text>}
      {!!item.comment && <Text style={styles.stepNote}>{item.comment}</Text>}
    </View>
  );

  const listHeader = () => <Text style={styles.title}>{t('history')}</Text>;

  const commentsSection = (
    <View style={{ marginTop: 24 }}>
      <Divider />
      <Text style={styles.title}>{t('comments_section_title')}</Text>
      <CommentComposer issueId={issueId} onSubmitted={loadComments} />
      <IssueCommentsList comments={comments} unreadIds={unreadIds} />
    </View>
  );

  useEffect(() => {
    if (issue) {
      loadStatusStories();
    }
  }, [issue]);

  // Commentaires rechargés à chaque changement de la table (pull, nouveau commentaire) ; les
  // notifications de commentaire de cette issue sont lues dès qu'ils sont affichés ici (les non
  // lus restent mis en évidence le temps de la visite).
  useEffect(() => {
    let active = true;
    (async () => {
      const unread = await loadUnreadCommentIds(issueId);
      if (active) setUnreadIds(unread);
      await markIssueNotificationsRead(issueId);
    })();
    loadComments();
    const subscription = database.withChangesForTables(['comments']).subscribe(() => loadComments());
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [issueId, loadComments]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Récupère d'abord les dernières données du serveur avant de relire la base locale : sans
      // ce sync, "tirer pour rafraîchir" ne faisait que ré-afficher le même instantané local.
      runSyncSafely();
      await Promise.all([loadStatusStories(), loadComments()]);
    } catch (err) {
      console.log(err);
    } finally {
      setRefreshing(false);
    }
  };

  const dividerItem = () => <Divider />;
  return (
    <View style={styles.container}>
      <FlatList
        ItemSeparatorComponent={dividerItem}
        ListHeaderComponent={listHeader}
        ListFooterComponent={commentsSection}
        data={statusStories || []}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.datetime?.getTime?.() ?? index}_${index}`}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </View>
  );
}

export default Content;

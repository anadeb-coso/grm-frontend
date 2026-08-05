import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { Divider } from 'react-native-paper';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import { styles } from './Content.styles';
import { runSyncSafely } from '../../../../database/watermelonSyncManager';

function Content({ issue }) {
  const { t } = useTranslation();
  const [statusStories, setStatusStories] = useState();
  const [refreshing, setRefreshing] = useState(false);

  // L'historique de l'issue vient de `issue_status_stories` (table enfant WatermelonDB, ex
  // `issue.issue_status_stories[]` CouchDB) — pas de `comments` (ça, c'est l'onglet "Activity"
  // dans la modale de détail, un concept distinct). `issue.record` porte la référence au vrai
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

  useEffect(() => {
    if (issue) {
      loadStatusStories();
    }
  }, [issue]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Récupère d'abord les dernières données du serveur avant de relire la base locale : sans
      // ce sync, "tirer pour rafraîchir" ne faisait que ré-afficher le même instantané local.
      await runSyncSafely();
      await loadStatusStories();
    } catch (err) {
      console.log(err);
    } finally {
      setRefreshing(false);
    }
  };

  const dividerItem = () => <Divider />;
  return (
    <View style={styles.container}>
      {statusStories?.length > 0 && (
        <FlatList
          ItemSeparatorComponent={dividerItem}
          ListHeaderComponent={listHeader}
          data={statusStories}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.datetime?.getTime?.() ?? index}_${index}`}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}

export default Content;

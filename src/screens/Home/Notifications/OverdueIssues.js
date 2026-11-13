import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Divider, Text } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import moment from 'moment';
import { useTranslation } from 'react-i18next';

import { useOverdueIssues } from '../../../utils/issueDeadlines';
import { toLegacyIssueShape } from '../../../utils/issueLegacyShape';
import { colors } from '../../../utils/colors';

const LEVEL_LABEL_KEYS = {
  Village: 'level_village', Canton: 'level_canton', Commune: 'level_commune',
  Prefecture: 'level_prefecture', Region: 'level_region', Country: 'level_country',
};

/** Plaintes en retard d'un village, ouvertes depuis l'espace Notifications. */
function OverdueIssues({ route, navigation }) {
  const { t } = useTranslation();
  const { villageId, villageName } = route.params;
  const { loading, overdue } = useOverdueIssues();
  const [opening, setOpening] = useState(null);

  useEffect(() => {
    navigation.setOptions({ headerTitle: villageName || t('overdue_issues_title') });
  }, [navigation, villageName, t]);

  const items = overdue.filter(({ issue }) => String(issue.administrativeRegionId ?? '') === String(villageId));

  const openIssue = async (issue) => {
    setOpening(issue.id);
    try {
      const item = await toLegacyIssueShape(issue);
      navigation.navigate('Dashboard', { screen: 'IssueDetailTabs', params: { item, merge: true } });
    } finally {
      setOpening(null);
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} size="large" />;
  }

  return (
    <FlatList
      style={{ backgroundColor: 'white' }}
      data={items}
      keyExtractor={({ issue }) => issue.id}
      ListEmptyComponent={<Text style={styles.empty}>{t('no_overdue_issues')}</Text>}
      renderItem={({ item: { issue, level, deadline, daysLate } }) => (
        <>
          <TouchableOpacity style={styles.item} onPress={() => openIssue(issue)} disabled={!!opening}>
            <View style={{ flex: 1 }}>
              <Text style={styles.code}>{issue.trackingCode || issue.internalCode}</Text>
              <Text style={styles.detail}>
                {t(LEVEL_LABEL_KEYS[level] || 'level_village')} · {t('deadline_label')} {moment(deadline).format('DD/MM/YYYY')}
              </Text>
              <Text style={styles.late}>{t('days_late', { count: daysLate })}</Text>
            </View>
            {opening === issue.id
              ? <ActivityIndicator color={colors.primary} />
              : <Feather name="chevron-right" size={20} color="#b0b0b0" />}
          </TouchableOpacity>
          <Divider style={{ marginHorizontal: '5%' }} />
        </>
      )}
    />
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 18 },
  code: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: '#373737' },
  detail: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#707070', marginTop: 2 },
  late: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: colors.error, marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 40, color: '#707070', fontFamily: 'Poppins_400Regular' },
});

export default OverdueIssues;

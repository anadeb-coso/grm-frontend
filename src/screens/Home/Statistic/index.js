import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  View, Text, StyleSheet,
  RefreshControl
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { Q } from '@nozbe/watermelondb';
import { useSelector } from 'react-redux';
import { colors } from '../../../utils/colors';
import { database } from '../../../database';
import { runSyncSafely } from '../../../database/watermelonSyncManager';
import ChartIssues from '../../../components/Chart/ChartIssues';

export function IssuesStatistic() {
  const { t } = useTranslation();

  const [refreshing, setRefreshing] = useState(false);
  const [issues, setIssues] = useState();

  const { userDocument: eadl } = useSelector((state) => state.get('userDocument').toObject());


  useEffect(() => {

    get_issues();

  }, []);



  const get_issues = async () => {
    setIssues([]);

    if (!(eadl && eadl.representative)) return;

    const isGlobalViewer = eadl.administrative_region == '1'
      && eadl.representative.groups
      && (eadl.representative.groups.includes('ViewerOfAllIssues') || eadl.representative.groups.includes('Admin'));


    try {
      const [issueRecords, statusRecords, categoryRecords] = await Promise.all([
        database.get('issues').query(Q.where('confirmed', true)).fetch(),
        database.get('issue_statuses').query().fetch(),
        database.get('issue_categories').query().fetch(),
      ]);
      const statusesByServerId = new Map(statusRecords.map((s) => [s.id, s]));
      const categoriesByServerId = new Map(categoryRecords.map((c) => [c.id, c]));
      let docs = issueRecords.map((issue) => {
        const status = statusesByServerId.get(issue.statusId);
        const category = categoriesByServerId.get(issue.categoryId);
        return {
          reporter: issue.reporterId ? { id: issue.reporterId } : null,
          assignee: issue.assigneeId ? { id: issue.assigneeId, name: issue.assigneeName } : null,
          status: status ? { id: status.legacyId, name: status.name } : null,
          category: category ? { id: category.legacyId, name: category.name } : null,
          publish: issue.publish,
        };
      });

      // Filtre selon les droits de l'utilisateur : un viewer global voit toutes les issues
      // confirmées, un utilisateur "pays" (administrative_region == '1') sans droit global ne
      // voit que les issues publiées, et un facilitateur ne voit que les issues qu'il a
      // rapportées ou qui lui sont assignées.
      if (isGlobalViewer) {
        // pas de filtre supplémentaire : toutes les issues confirmées
      } else if (eadl.administrative_region == '1') {
        docs = docs.filter((issue) => issue.publish);
      } else {
        docs = docs.filter((issue) => (
          (issue.reporter && issue.reporter.id === eadl.representative.id)
          || (issue.assignee && issue.assignee.id === eadl.representative.id)
        ));
      }

      setIssues(docs);
      setRefreshing(false);
    } catch (err) {
      console.log(err);
      setRefreshing(false);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    // Récupère d'abord les dernières données du serveur avant de relire la base locale : sans ce
    // sync, "tirer pour rafraîchir" ne faisait que ré-afficher le même instantané local, sans
    // jamais aller chercher les mises à jour côté serveur.
    try {
      runSyncSafely();
    } catch (err) {
      console.log(err);
    }
    //Get Issues
    await get_issues();
    //End Get Issues

  };




  if (!issues) return <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} size="small" />;


  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >

        <View style={{ flex: 1, margin: 25 }}>
          <Text>
            <Text style={styles.text_title}>{t('number_issues_saved')} : </Text>
            <Text>{issues.length ?? " - "}</Text>
          </Text>
          <Text>
            <Text style={styles.text_title}>{t('number_issues_in_follow_up')} : </Text>
            <Text>{issues.filter(
              (issue) => (issue.assignee && issue.assignee.id && issue?.status?.id === 2)
            ).length + "/" + issues.filter(
              (issue) => (issue.assignee && issue.assignee.id)
            ).length}</Text>
          </Text>
          <Text>
            <Text style={styles.text_title}>{t('number_issues_tracked_and_resolved')} : </Text>
            <Text>{issues.filter(
              (issue) => (issue?.status?.id === 3)
            ).length ?? " - "}</Text>
          </Text>
          <Text>
            <Text style={styles.text_title}>{t('number_issues_not_opened')} : </Text>
            <Text>{issues.filter(
              (issue) => (issue?.status?.id === 1)
            ).length ?? " - "}</Text>
          </Text>
        </View>

      <View style={{ flex: 1, margin: 25 }}>
        <ChartIssues issues={issues} />
      </View>


    </ScrollView >
  );
}



const styles = StyleSheet.create({
  text_title: {
    fontSize: 16,
    // fontFamily="body"
    fontWeight: 'bold',
    color: "green",
  }
});


export default IssuesStatistic;

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  View, Text, StyleSheet,
  RefreshControl
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { colors } from '../../../utils/colors';
import { LocalGRMDatabase } from '../../../utils/databaseManager';
import ChartIssues from '../../../components/Chart/ChartIssues';

export function IssuesStatistic() {
  const { t } = useTranslation();

  const [refreshing, setRefreshing] = useState(false);
  const [issues, setIssues] = useState();


  useEffect(() => {

    get_issues();

  }, []);



  const get_issues = () => {
    setIssues([]);
    let selector = {
      type: 'issue',
      confirmed: true
    }


    LocalGRMDatabase.find({
      selector: selector
    })
      .then((result) => {
        setIssues(result?.docs ?? []);
        setRefreshing(false);
      })
      .catch((err) => {
        console.log(err);
        setRefreshing(false);
      });
  }

  const onRefresh = async () => {
    setRefreshing(true);
    //Get Issues
    get_issues();
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

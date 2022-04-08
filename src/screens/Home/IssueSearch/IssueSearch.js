import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';
import { useSelector } from 'react-redux';
import { ActivityIndicator } from 'react-native-paper';
import Content from './containers';
import { styles } from './IssueSearch.style';
import LocalDatabase, { LocalGRMDatabase } from '../../../utils/databaseManager';
import { colors } from '../../../utils/colors';

function IssueSearch() {
  const customStyles = styles();
  const [issues, setIssues] = useState();
  const [statuses, setStatuses] = useState();
  const [eadl, setEadl] = useState(false);
  const { username } = useSelector((state) => state.get('authentication').toObject());

  useEffect(() => {
    LocalGRMDatabase.find({
      selector: { type: 'issue_status' },
    })
      .then((result) => {
        setStatuses(result.docs);
      })
      .catch((err) => {
        alert(`Unable to retrieve statuses. ${JSON.stringify(err)}`);
      });
  }, []);

  useEffect(() => {
    if (username) {
      LocalDatabase.find({
        selector: { 'representative.email': username },
        // fields: ["_id", "commune", "phases"],
      })
        .then((result) => {
          setEadl(result.docs[0]);

          // handle result
        })
        .catch((err) => {
          console.log('ERROR FETCHING EADL', err);
        });
    }
  }, [username]);

  useEffect(() => {
    // FETCH ISSUE CATEGORY
    if (eadl) {
      LocalGRMDatabase.find({
        selector: {
          type: 'issue',
          'reporter.name': eadl.representative.name,
        },
      })
        .then((result) => {
          setIssues(result?.docs);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [eadl]);

  if (!issues)
    return <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} size="small" />;
  return (
    <SafeAreaView style={customStyles.container}>
      <Content issues={issues} eadl={eadl} statuses={statuses} />
    </SafeAreaView>
  );
}

export default IssueSearch;

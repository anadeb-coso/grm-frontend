import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { colors } from '../../../utils/colors';
import { LocalGRMDatabase } from '../../../utils/databaseManager';
import { styles } from './IssueSearch.style';
import Content from './containers';

function IssueSearch() {
  const customStyles = styles();
  const [issues, setIssues] = useState();
  const [statuses, setStatuses] = useState();

  const { userDocument: eadl } = useSelector((state) => state.get('userDocument').toObject());

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
    // FETCH ISSUE CATEGORY
    if (eadl) {
      LocalGRMDatabase.find({
        selector: {
          type: 'issue',
          // 'reporter.id': eadl.representative.id,
          "$or": [
            {
              "reporter.id": eadl.representative.id
            },
            {
              "assignee.id": eadl.representative.id
            }
          ]
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

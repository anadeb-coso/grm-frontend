import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';
import { useSelector } from 'react-redux';
import Content from './containers';
import { styles } from './IssueSearch.style';
import LocalDatabase, { LocalGRMDatabase } from '../../../utils/databaseManager';

function IssueSearch() {
  const customStyles = styles();
  const [issues, setIssues] = useState([]);
  const [eadl, setEadl] = useState(false);
  const { username } = useSelector((state) => state.get('authentication').toObject());

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

  return (
    <SafeAreaView style={customStyles.container}>
      <Content issues={issues} eadl={eadl} />
    </SafeAreaView>
  );
}

export default IssueSearch;

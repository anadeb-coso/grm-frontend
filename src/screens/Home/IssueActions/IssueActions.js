import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';
import { useSelector } from 'react-redux';
import Content from './containers/Content';
import { styles } from './IssueActions.styles';
import LocalDatabase, { LocalGRMDatabase } from '../../../utils/databaseManager';

function IssueActions({ route, navigation }) {
  const { params } = route;
  const [statuses, setStatuses] = useState();
  const [eadl, setEadl] = useState();
  const customStyles = styles();
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
          console.log(err);
        });
    }
  }, [username]);

  return (
    <SafeAreaView style={customStyles.container}>
      <Content eadl={eadl} issue={params.item} navigation={navigation} statuses={statuses} />
    </SafeAreaView>
  );
}

export default IssueActions;

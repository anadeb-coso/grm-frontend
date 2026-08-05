import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';
import { useSelector } from 'react-redux';
import { database } from '../../../database';
import { styles } from './IssueActions.styles';
import Content from './containers/Content';

function IssueActions({ route, navigation }) {
  const { params } = route;
  const [statuses, setStatuses] = useState();
  const customStyles = styles();

  const { userDocument: eadl } = useSelector((state) => state.get('userDocument').toObject());



  useEffect(() => {
    database.get('issue_statuses').query().fetch()
      .then((records) => {
        setStatuses(records.map((s) => ({
          id: s.legacyId,
          name: s.name,
          final_status: s.finalStatus,
          initial_status: s.initialStatus,
          rejected_status: s.rejectedStatus,
          open_status: s.openStatus,
          unresolved_status: s.unresolvedStatus,
          eligible_status: s.eligibleStatus,
          not_eligible_status: s.notEligibleStatus,
        })));
      })
      .catch((err) => {
        alert(`Unable to retrieve statuses. ${JSON.stringify(err)}`);
      });
  }, []);

  return (
    <SafeAreaView style={customStyles.container}>
      <Content eadl={eadl} issue={params.item} navigation={navigation} statuses={statuses} />
    </SafeAreaView>
  );
}

export default IssueActions;

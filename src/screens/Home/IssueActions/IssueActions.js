import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';
import { useSelector } from 'react-redux';
import { LocalGRMDatabase } from '../../../utils/databaseManager';
import { styles } from './IssueActions.styles';
import Content from './containers/Content';

function IssueActions({ route, navigation }) {
  const { params } = route;
  const [statuses, setStatuses] = useState();
  const customStyles = styles();

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

  return (
    <SafeAreaView style={customStyles.container}>
      <Content eadl={eadl} issue={params.item} navigation={navigation} statuses={statuses} />
    </SafeAreaView>
  );
}

export default IssueActions;

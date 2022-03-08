import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';
import { useSelector } from 'react-redux';
import Content from './containers/Content';
import { styles } from './CitizenReportStep3.styles';
import LocalDatabase from '../../../utils/databaseManager';

function CitizenReportStep3({ route }) {
  const { params } = route;
  const customStyles = styles();
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
          console.log(err);
        });
    }
  }, [username]);
  return (
    <SafeAreaView style={customStyles.container}>
      <Content
        eadl={eadl}
        issue={{
          ...params.stepOneParams,
          ...params.stepTwoParams,
          ...params.stepLocationParams,
        }}
      />
    </SafeAreaView>
  );
}

export default CitizenReportStep3;

import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';
import { useSelector } from 'react-redux';
import Content from './containers/Content';
import { styles } from './CitizenReportLocationStep.styles';
import LocalDatabase, { LocalCommunesDatabase } from '../../../utils/databaseManager';

function CitizenReportLocationStep({ route }) {
  const { params } = route;
  const [issueCommunes, setIssueCommunes] = useState();
  const [uniqueRegion, setUniqueRegion] = useState();

  const { username } = useSelector((state) => state.get('authentication').toObject());

  useEffect(() => {
    if (username) {
      LocalDatabase.find({
        selector: { 'representative.email': username },
        // fields: ["_id", "commune", "phases"],
      })
        .then((result) => {
          if (result.docs[0] && result.docs[0]?.unique_region === 1) {
            LocalCommunesDatabase.find({
              selector: { administrative_id: result.docs[0].administrative_region },
            }).then((regions) => {
              setUniqueRegion(regions.docs[0]);
            });
          }

          // handle result
        })
        .catch((err) => {
          console.log('ERROR FETCHING EADL', err);
        });
    }
  }, [username]);

  useEffect(() => {
    // FETCH LOCATIONS
    LocalCommunesDatabase.find({
      selector: { type: 'administrative_level' },
    }).then((result) => {
      setIssueCommunes(result?.docs);
    });
  }, []);

  const customStyles = styles();
  return (
    <SafeAreaView style={customStyles.container}>
      <Content
        stepOneParams={params.stepOneParams}
        stepTwoParams={params.stepTwoParams}
        issueCommunes={issueCommunes}
        uniqueRegion={uniqueRegion}
      />
    </SafeAreaView>
  );
}

export default CitizenReportLocationStep;

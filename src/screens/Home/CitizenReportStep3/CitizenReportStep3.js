import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { ActivityIndicator } from 'react-native-paper';
import Content from './containers/Content';
import { styles } from './CitizenReportStep3.styles';
import { getUserDocs } from '../../../utils/databaseManager';
import { setCommune, setDocument } from '../../../store/ducks/userDocument.duck';
import { colors } from '../../../utils/colors';
import { LocalGRMDatabase } from "../../../utils/databaseManager";

function CitizenReportStep3({ route }) {
  const { params } = route;
  const customStyles = styles();
  const dispatch = useDispatch();

  const { username } = useSelector((state) => state.get('authentication').toObject());
  const { userDocument: eadl } = useSelector((state) => state.get('userDocument').toObject());
  const [issues, setIssues] = useState(null);

  useEffect(() => {
    const fetchUserCommune = async () => {
      if (!eadl) {
        const { userDoc, userDocument: usrC } = await getUserDocs(username);
        if (userDoc) {
          dispatch(setDocument(userDoc)); // Dispatch setDocument action
        }
        if (usrC) {
          dispatch(setCommune(usrC)); // Dispatch setCommune action
        }
      }
    };

    fetchUserCommune(); // Call the fetch userDocument data function
  }, [dispatch, eadl, username]);
  
  useEffect(() => {
    // FETCH ISSUEs
    // if (eadl) {
      LocalGRMDatabase.find({
        selector: {
          type: 'issue'
        },
      })
        .then((result) => {
          setIssues(result?.docs ?? []);
        })
        .catch((err) => {
          console.log(err);
        });
    // }
  }, []);

  if (issues == null)
    return <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} size="small" />;

  return (
    <SafeAreaView style={customStyles.container}>
      <Content
        eadl={eadl}
        issue={{
          ...params.stepOneParams,
          ...params.stepTwoParams,
          ...params.stepLocationParams,
        }}
        issues={issues}
      />
    </SafeAreaView>
  );
}

export default CitizenReportStep3;

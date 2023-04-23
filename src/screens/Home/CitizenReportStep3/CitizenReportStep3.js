import React, { useEffect } from 'react';
import { SafeAreaView } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Content from './containers/Content';
import { styles } from './CitizenReportStep3.styles';
import { getUserDocs } from '../../../utils/databaseManager';
import { setCommune, setDocument } from '../../../store/ducks/userDocument.duck';

function CitizenReportStep3({ route }) {
  const { params } = route;
  const customStyles = styles();
  const dispatch = useDispatch();

  const { username } = useSelector((state) => state.get('authentication').toObject());
  const { userDocument: eadl } = useSelector((state) => state.get('userDocument').toObject());

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

import React, { useEffect } from 'react';
import { SafeAreaView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { setCommune, setDocument } from '../../../store/ducks/userDocument.duck';
import { getUserDocs } from '../../../utils/databaseManager';
import { styles } from './CitizenReportLocationStep.styles';
import Content from './containers/Content';

function CitizenReportLocationStep({ route }) {
  const { params } = route;
  const dispatch = useDispatch();
  //   const [issueCommunes, setIssueCommunes] = useState();
  //   const [uniqueRegion, setUniqueRegion] = useState();

  const { username } = useSelector((state) => state.get('authentication').toObject());
  const { userCommune } = useSelector((state) => state.get('userDocument').toObject());

  useEffect(() => {
    const fetchUserCommune = async () => {
      if (!userCommune) {
        const { userDoc, userCommune: usrC } = await getUserDocs(username);
        if (userDoc) {
          dispatch(setDocument(userDoc)); // Dispatch setDocument action
        }
        if (usrC) {
          dispatch(setCommune(usrC)); // Dispatch setCommune action
        }
      }
    };

    fetchUserCommune(); // Call the fetch userCommune data function
  }, [dispatch, userCommune, username]);

  const customStyles = styles();
  return (
    <SafeAreaView style={customStyles.container}>
      <Content
        stepOneParams={params.stepOneParams}
        stepTwoParams={params.stepTwoParams}
        // issueCommunes={issueCommunes}
        uniqueRegion={userCommune}
      />
    </SafeAreaView>
  );
}

export default CitizenReportLocationStep;

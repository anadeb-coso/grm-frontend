import React, { useEffect, useState } from 'react';
import { SafeAreaView, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { ActivityIndicator } from 'react-native-paper';
import { setCommune, setDocument } from '../../../store/ducks/userDocument.duck';
import { getUserDocs } from '../../../utils/databaseManager';
import { styles } from './CitizenReportLocationStep.styles';
import Content from './containers/Content';
// import { LocalADMINLEVELDatabase } from "../../../utils/databaseManager";
import { colors } from '../../../utils/colors';
import API from '../../../services/API';
import NetInfo from '@react-native-community/netinfo';

function CitizenReportLocationStep({ route }) {
  const { params } = route;
  const dispatch = useDispatch();
  //   const [issueCommunes, setIssueCommunes] = useState();
  //   const [uniqueRegion, setUniqueRegion] = useState();

  const { username } = useSelector((state) => state.get('authentication').toObject());
  const { userCommune } = useSelector((state) => state.get('userDocument').toObject());
  const [cantons, setCantons] = useState(null);
  const [villages, setVillages] = useState(null);

  useEffect(() => {
    const fetchUserCommune = async () => {
      if (!userCommune) {
        console.log(username)
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

  useEffect(() => {
    //FETCH CANTONS ADMINISTRATIVE LEVEL
  //   LocalADMINLEVELDatabase.find({
  //     selector: { parent_id: "1" },
  //   })
  //     .then(function (result) {
  //       console.log(result?.docs + "-------------");
  //       setCantons(result?.docs);
  //     })
  //     .catch(function (err) {
  //       console.log(err);
  //     });
//   NetInfo.fetch().then((state) => {
//     console.log('Connection type', state.type);
//     console.log('Is connected?', state.isConnected);
// });
// const unsubscribe = NetInfo.addEventListener((state) => {
//     console.log('Connection type', state.type);
//     console.log('Is connected?', state.isConnected);
// });


  new API().administrativeLevelsFilterByAdministrativeRegion(userCommune.administrative_id, {}).then((response) => {
    if (response.error) {
      Alert.alert('Warning', response?.error?.toString(), [{ text: 'OK' }], {
        cancelable: false,
      });
      return;
    }
    setCantons(response.cantons);
    setVillages(response.villages);
  });

  NetInfo.fetch().then((state) => {
      if(!state.isConnected){
        setCantons([]);
        setVillages([]);
      }
  });

  setTimeout(function(){
    console.log("ici"),
    setCantons([]);
    setVillages([]);
  }, 10000);


  }, []);

  const customStyles = styles();
  if (cantons == null || villages == null){
    return <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} size="small" />;
  }else{
    return (
      <SafeAreaView style={customStyles.container}>
        <Content
          stepOneParams={params.stepOneParams}
          stepTwoParams={params.stepTwoParams}
          // issueCommunes={issueCommunes}
          uniqueRegion={userCommune}
          cantons={cantons}
          villages={villages}
        />
      </SafeAreaView>
    );
  }
    
  
}

export default CitizenReportLocationStep;

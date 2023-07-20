import React, { useEffect, useState } from 'react';
import { SafeAreaView, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { ActivityIndicator } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { setCommune, setDocument } from '../../../store/ducks/userDocument.duck';
import { getUserDocs } from '../../../utils/databaseManager';
import { styles } from './CitizenReportLocationStep.styles';
import Content from './containers/Content';
// import { LocalADMINLEVELDatabase } from "../../../utils/databaseManager";
import { colors } from '../../../utils/colors';
import API from '../../../services/API';
import NetInfo from '@react-native-community/netinfo';

function CitizenReportLocationStep({ route }) {
  const { t } = useTranslation();
  const { params } = route;
  const dispatch = useDispatch();
  //   const [issueCommunes, setIssueCommunes] = useState();
  //   const [uniqueRegion, setUniqueRegion] = useState();

  const { username } = useSelector((state) => state.get('authentication').toObject());
  const { userCommune } = useSelector((state) => state.get('userDocument').toObject());
  const [cantons, setCantons] = useState(null);
  const [villages, setVillages] = useState(null);
  const [loading, setLoading] = useState(false);

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

  setLoading(true);
  new API().administrativeLevelsFilterByAdministrativeRegion(userCommune.administrative_id, {}).then((response) => {
    if (response.error) {
      setCantons([]);
      setVillages([]);
      Alert.alert('Warning', response?.error?.toString(), [{ text: 'OK' }], {
        cancelable: false,
      });
      return;
    }else{
      setCantons(response.cantons);
      setVillages(response.villages);
    }
    
    setLoading(false);
    
  });

  NetInfo.fetch().then((state) => {
      if(!state.isConnected){
        setCantons([]);
        setVillages([]);
        setLoading(false);
      }
  });

  setTimeout(function(){
    if(loading) {
      Alert.alert('Warning', t('warning_message_location_not_load'), [{ text: 'OK' }], {
        cancelable: false,
      });
      setLoading(false);
    }
  }, 10000);



  }, []);

  const customStyles = styles();
  if (loading){
    return <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} size="small" />;
  }else{
    if(cantons == null && villages == null){
      setCantons([]);
      setVillages([]);
    }
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

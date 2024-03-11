import React, { useEffect, useState } from 'react';
import { SafeAreaView, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { ActivityIndicator } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { setCommune, setDocument } from '../../../store/ducks/userDocument.duck';
import { getUserDocs, LocalDatabase } from '../../../utils/databaseManager';
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
  const { userDocument: eadl } = useSelector((state) => state.get('userDocument').toObject());
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

    if(userCommune){
      setLoading(true);
    LocalDatabase.find({
      selector: {
        'representative.email': eadl.representative.email
      }
    }).then((res) => {
      if (res.docs && res.docs.length > 0) {
        if (res.docs[0].administrative_regions_objects) {
          let _cantons = [];
          let _vilages = [];
          let adm_regions_objects = res.docs[0].administrative_regions_objects;
          for (let i = 0; i < adm_regions_objects.length; i++) {
            _cantons.push({
              id: adm_regions_objects[i].id,
              name: adm_regions_objects[i].name,
              parent: adm_regions_objects[i].parent,
              commune: adm_regions_objects[i].parent,
              prefecture: adm_regions_objects[i].prefecture,
              region: adm_regions_objects[i].region
            });
            if (adm_regions_objects[i].villages) {
              for (let index = 0; index < adm_regions_objects[i].villages.length; index++) {
                _vilages.push({
                  id: adm_regions_objects[i].villages[index].id,
                  name: adm_regions_objects[i].villages[index].name,
                  parent: adm_regions_objects[i].villages[index].parent,
                  canton: adm_regions_objects[i].villages[index].parent,
                  commune: adm_regions_objects[i].villages[index].commune,
                  prefecture: adm_regions_objects[i].villages[index].prefecture,
                  region: adm_regions_objects[i].villages[index].region
                })
              }
            }

          }
          setCantons(_cantons);
          setVillages(_vilages)
          setLoading(false);

        } else {
          new API().administrativeLevelsFilterByAdministrativeRegion(username, userCommune.administrative_id, {}).then((response) => {
            if (response.error) {
              setCantons([]);
              setVillages([]);
              setLoading(false);
              Alert.alert('Warning', response?.error?.toString(), [{ text: 'OK' }], {
                cancelable: false,
              });
              // return;
            } else {
              setCantons(response.cantons);
              setVillages(response.villages);
              setLoading(false);
            }
          });

        }

      }
    }).catch((er) => {
      console.log(er);
      setCantons([]);
      setVillages([]);
      setLoading(false);
      Alert.alert('Warning', response?.er?.toString(), [{ text: 'OK' }], {
        cancelable: false,
      });
    })
    }


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

    // setLoading(true);
    // new API().administrativeLevelsFilterByAdministrativeRegion(username, userCommune.administrative_id, {}).then((response) => {
    //   if (response.error) {
    //     setCantons([]);
    //     setVillages([]);
    //     setLoading(false);
    //     Alert.alert('Warning', response?.error?.toString(), [{ text: 'OK' }], {
    //       cancelable: false,
    //     });
    //     // return;
    //   } else {
    //     setCantons(response.cantons);
    //     setVillages(response.villages);
    //     setLoading(false);
    //   }


    // });

    NetInfo.fetch().then((state) => {
      if (!state.isConnected) {
        setCantons([]);
        setVillages([]);
        setLoading(false);
      }
    });

    setTimeout(function () {
      if (loading) {
        setLoading(false);
        Alert.alert('Warning', t('warning_message_location_not_load'), [{ text: 'OK' }], {
          cancelable: false,
        });
      }
    }, 10000);



  }, []);

  const customStyles = styles();
  if (loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} size="small" />;
  } else {
    if (cantons == null && villages == null) {
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

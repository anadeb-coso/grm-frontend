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
  const { userDocument: eadl } = useSelector((state) => state.get('userDocument').toObject());
  const [cantons, setCantons] = useState(null);
  const [villages, setVillages] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const get_user_adl_infos = async () => {

    const fetchUserCommune = async () => {
      if (!userCommune) {
        const { userDoc, userCommune: usrC } = await getUserDocs();
        if (userDoc) {
          dispatch(setDocument(userDoc)); // Dispatch setDocument action
        }
        if (usrC) {
          dispatch(setCommune(usrC)); // Dispatch setCommune action
        }
      }
    };

    fetchUserCommune(); // Call the fetch userCommune data function
      
    if (userCommune) {
      setLoading(true);
      
      const adm_regions_objects = eadl?.administrative_regions_objects;
      
      if (adm_regions_objects && adm_regions_objects.length > 0) {
        let _cantons = [];
        let _villages = [];
        for (let i = 0; i < adm_regions_objects.length; i++) {
          _cantons.push({
            id: adm_regions_objects[i].id,
            name: adm_regions_objects[i].name,
            // parent: adm_regions_objects[i].parent,
            // commune: adm_regions_objects[i].parent,
            // prefecture: adm_regions_objects[i].prefecture,
            // region: adm_regions_objects[i].region
          });
          if (adm_regions_objects[i].villages) {
            for (let index = 0; index < adm_regions_objects[i].villages.length; index++) {
              _villages.push({
                id: adm_regions_objects[i].villages[index].id,
                name: adm_regions_objects[i].villages[index].name,
                parent: adm_regions_objects[i].villages[index].parent ?? adm_regions_objects[i].id,
                // canton: adm_regions_objects[i].villages[index].parent,
                // commune: adm_regions_objects[i].villages[index].commune,
                // prefecture: adm_regions_objects[i].villages[index].prefecture,
                // region: adm_regions_objects[i].villages[index].region
              })
            }
          }

        }
        
        setCantons(_cantons.sort((a, b) => a.name.localeCompare(b.name)) ?? []);
        setVillages(_villages.sort((a, b) => a.name.localeCompare(b.name)) ?? []);
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
            setCantons(response.cantons ?? []);
            setVillages(response.villages ?? []);
            setLoading(false);
          }
        }).catch((er) => {
          console.log(er);
          setCantons([]);
          setVillages([]);
          setLoading(false);
          Alert.alert('Warning', er?.toString(), [{ text: 'OK' }], {
            cancelable: false,
          });
        });
      }
    }

  }
  useEffect(() => {
    
    get_user_adl_infos();

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

    // Ne sert que de filet de sécurité (spinner qui ne se termine jamais) si aucune donnée
    // locale n'a pu être chargée : `get_user_adl_infos()` (effet ci-dessus) sait déjà lire les
    // cantons/villages depuis le cache local hors-ligne, donc ce check ne doit jamais écraser des
    // données déjà chargées par cet effet — sinon, selon l'ordre d'arrivée (race condition), un
    // `NetInfo.fetch()` qui se résout après coup effaçait silencieusement les cantons/villages
    // déjà affichés dès qu'on est hors connexion (symptôme observé : champ village qui ne
    // s'affiche jamais après sélection du canton, nécessitant plusieurs rafraîchissements).
    NetInfo.fetch().then((state) => {
      if (!state.isConnected) {
        setCantons((prev) => (prev && prev.length > 0 ? prev : []));
        setVillages((prev) => (prev && prev.length > 0 ? prev : []));
        setLoading(false);
      }
    });
    
    // setTimeout(function () {
    //   if (loading) {
    //     setLoading(false);
    //     Alert.alert('Warning', t('warning_message_location_not_load'), [{ text: 'OK' }], {
    //       cancelable: false,
    //     });
    //   }
    // }, 10000);



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
          get_user_adl_infos={get_user_adl_infos}
        />
      </SafeAreaView>
    );
  }


}

export default CitizenReportLocationStep;

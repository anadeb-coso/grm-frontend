import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ActivityIndicator, Snackbar } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import NetInfo from '@react-native-community/netinfo';
import { Q } from '@nozbe/watermelondb';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../../utils/colors';
import { database } from '../../../database';
import { runSyncSafely } from '../../../database/watermelonSyncManager';
import { useSyncCompletion } from '../../../database/useSyncCompletion';
import { styles } from './IssueSearch.style';
import Content from './containers';
import SnackBarCheckFileUnsyncComponent from '../../../components/SnackBarCheckFileUnsyncComponent/SnackBarCheckFileUnsyncComponent';
import { toLegacyIssueShapes } from '../../../utils/issueLegacyShape';

function IssueSearch() {
  const { t } = useTranslation();
  const customStyles = styles();
  const navigation = useNavigation();

  const [issues, setIssues] = useState();
  const [statuses, setStatuses] = useState();
  const [issueCategories, setIssueCategories] = useState();

  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(t('unable_access_internet'));
  const [connected, setConnected] = useState(true);
  const [errorVisible, setErrorVisible] = React.useState(false);
  const onDismissSnackBar = () => setErrorVisible(false);


  const { userDocument: eadl } = useSelector((state) => state.get('userDocument').toObject());


  useEffect(() => {
    database.get('issue_statuses').query().fetch()
      .then((result) => {
        setStatuses(result.map((s) => ({ id: s.legacyId, name: s.name })));
      })
      .catch((err) => {
        alert(`Unable to retrieve statuses. ${JSON.stringify(err)}`);
      });

    database.get('issue_categories').query().fetch()
      .then((result) => {
        setIssueCategories(
          result
            .map((c) => ({ id: c.legacyId, name: c.name }))
            .filter((obj) => !([4, 7].includes(obj.id)))
        );
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  // Relit uniquement la base locale (déjà à jour après un sync) et applique les filtres de
  // visibilité. Ne déclenche PAS de synchronisation : réutilisé tel quel à la fin de chaque
  // synchronisation automatique (cf. `useSyncCompletion` plus bas), l'y appeler créerait une
  // boucle de synchronisation.
  const loadIssuesFromLocalDb = async () => {
    if (!(eadl && eadl.representative)) return;

    const issueRecords = await database.get('issues').query(Q.where('confirmed', true)).fetch();
    let docs = await toLegacyIssueShapes(issueRecords);

    const isGlobalViewer = eadl.administrative_region == '1'
      && eadl.representative.groups
      && (eadl.representative.groups.includes('ViewerOfAllIssues') || eadl.representative.groups.includes('Admin'));

    if (isGlobalViewer) {
      // pas de filtre supplémentaire : toutes les issues confirmées
    } else if (eadl.administrative_region == '1') {
      docs = docs.filter((issue) => issue.publish);
    } else {
      docs = docs.filter((issue) => (
        (issue.reporter && issue.reporter.id === eadl.representative.id)
        || (issue.assignee && issue.assignee.id === eadl.representative.id)
      ));
    }

    docs.sort((a, b) => {
      if (a.created_date && b.created_date) {
        return a.created_date < b.created_date ? 1 : -1; // descending
      }
      return 0;
    });

    setIssues(docs);
  };

  const get_issues = async () => {

    setConnected(true);
    await check_network();

    setIssues([]);
    if (!(eadl && eadl.representative)) return;

    // Récupère d'abord les dernières données du serveur avant de relire la base locale : sans ce
    // sync, "tirer pour rafraîchir" ne faisait que ré-afficher le même instantané local.
    try {
      runSyncSafely();
    } catch (err) {
      console.log(err);
    }

    try {
      await loadIssuesFromLocalDb();
      setRefreshing(false);
    } catch (err) {
      console.log(err);
      setRefreshing(false);
    }
  }

  // Quand une synchronisation automatique (intervalle, retour réseau, retour au premier plan) se
  // termine pendant que l'écran est ouvert, on relit la liste locale pour afficher les nouvelles
  // mises à jour sans que l'utilisateur ait à tirer pour rafraîchir.
  useSyncCompletion(loadIssuesFromLocalDb);

  useEffect(() => {
    // FETCH ISSUE CATEGORY
    get_issues();
  }, [eadl]);


  const check_network = async () => {
    NetInfo.fetch().then((state) => {
      if (!state.isConnected) {
          setErrorMessage(t('unable_access_wifi'));
          setErrorVisible(true);
          setConnected(false);
      }else if(!state.isInternetReachable){
          setErrorMessage(t('unable_access_internet'));
          setErrorVisible(true);
          setConnected(false);
      }
    });
  }
  const onRefresh = async () => {
    setRefreshing(true);

    //Get Issues
    await get_issues();
    //End Get Issues

  };

  useEffect(() => {

    const unsubscribe = navigation.addListener('focus', async () => {
        await onRefresh();
    });

    return unsubscribe;
  }, [navigation]);



  if (!issues || refreshing || !issueCategories)
    return <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} size="small" />;


  return (
    <View style={[customStyles.container, { flex: 1 }]}>

      <Content
        issues={issues}
        eadl={eadl}
        statuses={statuses}
        issueCategories={issueCategories}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />

      <Snackbar visible={errorVisible} duration={3000} onDismiss={onDismissSnackBar}>
        {errorMessage}
      </Snackbar>


      <SnackBarCheckFileUnsyncComponent />

    </View>
  );
}

export default IssueSearch;

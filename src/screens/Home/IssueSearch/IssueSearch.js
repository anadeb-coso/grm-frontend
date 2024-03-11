import React, { useEffect, useState } from 'react';
import { SafeAreaView, ToastAndroid, RefreshControl, ScrollView } from 'react-native';
import { ActivityIndicator, Snackbar } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import NetInfo from '@react-native-community/netinfo';
import { colors } from '../../../utils/colors';
import { LocalGRMDatabase } from '../../../utils/databaseManager';
import { styles } from './IssueSearch.style';
import Content from './containers';
import { logout } from '../../../store/ducks/authentication.duck';
import { getEncryptedData } from '../../../utils/storageManager';
import { verify_account_on_couchdb } from '../../../services/CouchDBRequest';

function IssueSearch() {
  const { t } = useTranslation();
  const customStyles = styles();
  const [issues, setIssues] = useState();
  const [statuses, setStatuses] = useState();
  const [issueCategories, setIssueCategories] = useState();

  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("Nous n'arrivons pas a accéder à l'internet. Veuillez vérifier votre connexion!");
  const [connected, setConnected] = useState(true);
  const [errorVisible, setErrorVisible] = React.useState(false);
  const onDismissSnackBar = () => setErrorVisible(false);


  const dispatch = useDispatch();
  const getDBConfig = async () => {
    const password = await getEncryptedData('userPassword');
    let dbCredentials;
    let username;
    if (password) {
      username = await getEncryptedData(`username`);
      dbCredentials = await getEncryptedData(
        `dbCredentials_${password}_${username.replace('@', '')}`
      );

      if (username) {
        if (!(await verify_account_on_couchdb(dbCredentials, username))) {
          ToastAndroid.show("Nous n'arrivons pas avoir vos informations sur le serveur.", ToastAndroid.LONG);
          dispatch(logout());
        }
      }
    }
  };
  useEffect(() => {
    getDBConfig();
  }, []);

  const { userDocument: eadl } = useSelector((state) => state.get('userDocument').toObject());


  useEffect(() => {
    LocalGRMDatabase.find({
      selector: { type: 'issue_status' },
    })
      .then((result) => {
        setStatuses(result.docs);
      })
      .catch((err) => {
        alert(`Unable to retrieve statuses. ${JSON.stringify(err)}`);
      });


      LocalGRMDatabase.find({
        selector: { type: "issue_category" },
      })
        .then(function (result) {
          setIssueCategories((result?.docs ?? []).filter((obj) => !([4, 7].includes(obj.id))));
        })
        .catch(function (err) {
          console.log(err);
        });

  }, []);

  const get_issues = () => {
    setIssues([]);
    if (eadl && eadl.representative) {
      let selector = {
        type: 'issue',
        // 'reporter.id': eadl.representative.id,
        confirmed: true,
        "$or": [
          {
            "reporter.id": eadl.representative.id
          },
          {
            "assignee.id": eadl.representative.id
          }
        ]
      }
      if (eadl.administrative_region == "1" && eadl.representative.groups && (eadl.representative.groups.includes("ViewerOfAllIssues") || eadl.representative.groups.includes("Admin"))) {
        selector = {
          type: 'issue',
          confirmed: true
        }
      } else if (eadl.administrative_region == "1") {
        selector = {
          type: 'issue',
          confirmed: true,
          publish: true
        }
      }

      LocalGRMDatabase.find({
        selector: selector
      })
        .then((result) => {
          let docs = result?.docs ?? [];
          docs.sort((a, b) => {
            if (a.created_date && b.created_date) {
              return a.created_date < b.created_date ? 1 : -1; // descending
              // return a.created_date > b.created_date ? 1 : -1; // ascending
            }
          });


          // setIssues(result?.docs);
          setIssues(docs);
          setRefreshing(false);
        })
        .catch((err) => {
          console.log(err);
          setRefreshing(false);
        });
    }
  }
  useEffect(() => {
    // FETCH ISSUE CATEGORY
    get_issues();
  }, [eadl]);


  const check_network = async () => {
    NetInfo.fetch().then((state) => {
      if (!state.isConnected) {
        setErrorMessage("Nous n'arrivons pas a accéder à l'internet. Veuillez vérifier votre connexion!");
        setErrorVisible(true);
        setConnected(false);
      }
    });
  }
  const onRefresh = async () => {
    setRefreshing(true);
    setConnected(true);
    await check_network();
    //Get Issues
    get_issues();
    //End Get Issues

  };



  if (!issues || refreshing || !issueCategories)
    return <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} size="small" />;

  console.log(issueCategories)
  return (
    <ScrollView _contentContainerStyle={{ pt: 7, px: 5 }}  style={customStyles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <SafeAreaView>

        <Content issues={issues} eadl={eadl} statuses={statuses} issueCategories={issueCategories} />

        <Snackbar visible={errorVisible} duration={3000} onDismiss={onDismissSnackBar}>
          {errorMessage}
        </Snackbar>
      </SafeAreaView>
    </ScrollView>
  );
}

export default IssueSearch;

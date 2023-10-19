import React, { useEffect, useState } from 'react';
import { SafeAreaView, ToastAndroid } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { LocalGRMDatabase } from '../../../utils/databaseManager';
import { styles } from './IssueActions.styles';
import Content from './containers/Content';
import { logout } from '../../../store/ducks/authentication.duck';
import { getEncryptedData } from '../../../utils/storageManager';
import { verify_account_on_couchdb } from '../../../services/CouchDBRequest';

function IssueActions({ route, navigation }) {
  const { t } = useTranslation();
  const { params } = route;
  const [statuses, setStatuses] = useState();
  const customStyles = styles();
  
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
  }, []);

  return (
    <SafeAreaView style={customStyles.container}>
      <Content eadl={eadl} issue={params.item} navigation={navigation} statuses={statuses} />
    </SafeAreaView>
  );
}

export default IssueActions;

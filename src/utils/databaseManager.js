import 'react-native-get-random-values';
import axios from 'axios';
import { getData, getEncryptedData, storeData } from './storageManager';
import { EXPO_PUBLIC_COUCHDB_BASE_URL } from '../services/env';
import { syncAllDatabases, setupNetworkSyncAutoRestart, cancelAllSyncs } from './syncManager';
import { LocalDatabase, LocalGRMDatabase } from './pouchInstances';


const couchDBURLBase = EXPO_PUBLIC_COUCHDB_BASE_URL;
export { couchDBURLBase };
export { LocalGRMDatabase, LocalDatabase };

global.__countNetInfoListener = 0;
export const SyncToRemoteDatabase = async ({ username, password, eadl }, userEmail) => {
  cancelAllSyncs();
  const start = () => syncAllDatabases({
    username,
    password,
    eadl,
    userEmail,
    couchDBURLBase: EXPO_PUBLIC_COUCHDB_BASE_URL,
    localDBs: {
      LocalDatabase,
      LocalGRMDatabase,
    }
  });

  // Sync immédiat
  start();

  // Sync automatique lors du retour d’Internet
  global.__countNetInfoListener += 1;
  setupNetworkSyncAutoRestart(start, global.__countNetInfoListener);

  getUserDocs(userEmail);

  // Redémarrage régulier (chaque 10 min)
  if (!global.__syncIntervalSet) {
    global.__syncIntervalSet = true;
    setInterval(() => {
      if (__DEV__) { console.log("Scheduled sync refresh"); }
      start();
    }, 10 * 60 * 1000);
  }
};




// Function to fetch documents from CouchDB with a Mango query
const fetchDocumentsByFilter = async (db_name, filter) => {
  const password = await getEncryptedData('userPassword');

  if (!password) {
    return false;
  }
  const usr = await getEncryptedData(`username`);

  const dbCredentials = await getEncryptedData(`dbCredentials_${password}_${usr.replace('@', '')}`);

  try {

    const response = await axios.post(
      `${couchDBURLBase}/${db_name}/_find`,
      {
        selector: filter, // Specify the filter criteria as the Mango query selector
      },
      {
        auth: {
          username: dbCredentials.username, // CouchDB username
          password: dbCredentials.password, // CouchDB password
        },
        headers: {
          'Content-Type': 'application/json',
        },
        // Enable CORS in Axios request
        // Note: This assumes that your CouchDB server has CORS enabled and configured to allow requests from the origin of your React Native app.
        // You may need to adjust the CORS configuration on your CouchDB server accordingly.
        crossDomain: true,
        withCredentials: true,
        timeout: 50000,
      }
    );

    return response.data;
  } catch (error) {
    if (__DEV__) { console.log('Error fetching documents by filter:', error); }
    throw error;
  }
};

export const getUserDocs = async (email) => {
  let userDoc;
  let userCommune;

  userDoc = await getData('userDoc');
  userCommune = await getData('userCommune');

  if (userDoc && userCommune && JSON.parse(userDoc) !== null && JSON.parse(userCommune) !== null) {
    // console.log(
    //   'Returning',
    //   JSON.parse(userDoc),
    //   userCommune,
    //   userDoc !== null,
    //   userCommune !== null
    // );
    return { userDoc: JSON.parse(userDoc), userCommune: JSON.parse(userCommune) };
  }
  const getUserDoc = await fetchDocumentsByFilter("eadls", {
    'representative.email': email,
  });

  if (getUserDoc?.docs?.length > 0) {
    [userDoc] = getUserDoc.docs;
    const getCommune = await fetchDocumentsByFilter("administrative_levels", {
      administrative_id: userDoc?.administrative_region,
      type: 'administrative_level',
    });
    if (getCommune?.docs?.length > 0) {
      [userCommune] = getCommune.docs;
    }
  }

  await storeData('userDoc', JSON.stringify(userDoc));
  await storeData('userCommune', JSON.stringify(userCommune));

  return { userDoc, userCommune };
};

export default LocalDatabase;

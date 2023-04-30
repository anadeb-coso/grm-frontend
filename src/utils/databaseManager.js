import axios from 'axios';
import PouchAsyncStorage from 'pouchdb-adapter-asyncstorage';
import PouchAuth from 'pouchdb-authentication';
import PouchFind from 'pouchdb-find';
import PouchDB from 'pouchdb-react-native';
import { getData, getEncryptedData, storeData } from './storageManager';

PouchDB.plugin(PouchAuth);
PouchDB.plugin(PouchFind);
PouchDB.plugin(require('pouchdb-upsert'));

PouchDB.plugin(PouchAsyncStorage);

const LocalDatabase = new PouchDB('eadl', {
  adapter: 'asyncstorage',
});

export const LocalGRMDatabase = new PouchDB('grm', {
  adapter: 'asyncstorage',
});

export const LocalCommunesDatabase = new PouchDB('commune', {
  adapter: 'asyncstorage',
});

export const SyncToRemoteDatabase = async ({ username, password }, userEmail) => {
  const remoteDB = new PouchDB('http://197.243.104.5/couchdb/eadls', {
    skip_setup: true,
  });

  const grmRemoteDB = new PouchDB('http://197.243.104.5/couchdb/grm', {
    skip_setup: true,
  });

  //   const communesRemoteDB = new PouchDB('http://197.243.104.5/couchdb/eadls', {
  //     skip_setup: true,
  //   });

  await remoteDB.login(username, password);
  await grmRemoteDB.login(username, password);
  const sync = LocalDatabase.sync(remoteDB, {
    live: true,
    retry: true,
    filter: 'eadl/by_user_email',
    query_params: { email: userEmail },
  });

  //   const syncCommunes = LocalCommunesDatabase.sync(communesRemoteDB, {
  //     live: true,
  //     retry: true,
  //     // view: "eadl/all_administrative_levels",
  //     // filter: filterFunction,
  //     // query_params: { usrEmail: userEmail },
  //   });

  const syncGRM = LocalGRMDatabase.sync(grmRemoteDB, {
    live: true,
    retry: true,
  });
  const syncStates = ['change', 'paused', 'active', 'denied', 'complete', 'error'];
  syncStates.forEach((state) => {
    sync.on(state, (currState) => console.log(`[Sync EADL: ]`));

    syncGRM.on(state, (currState) => console.log(`[Sync GRM: ]`));
  });

  getUserDocs(userEmail);
};

// Function to fetch documents from CouchDB with a Mango query
const fetchDocumentsByFilter = async (filter) => {
  const password = await getEncryptedData('userPassword');

  if (!password) {
    return false;
  }
  const usr = await getEncryptedData(`username`);

  const dbCredentials = await getEncryptedData(`dbCredentials_${password}_${usr.replace('@', '')}`);

  try {
    const response = await axios.post(
      `http://197.243.104.5/couchdb/eadls/_find`,
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
    console.log('Error fetching documents by filter:', error);
    throw error;
  }
};

export const getUserDocs = async (email) => {
  let userDoc;
  let userCommune;

  userDoc = await getData('userDoc');
  userCommune = await getData('userCommune');

  if (userDoc && userCommune && JSON.parse(userDoc) !== null && JSON.parse(userCommune) !== null) {
    console.log(
      'Returning',
      JSON.parse(userDoc),
      userCommune,
      userDoc !== null,
      userCommune !== null
    );
    return { userDoc: JSON.parse(userDoc), userCommune: JSON.parse(userCommune) };
  }
  const getUserDoc = await fetchDocumentsByFilter({
    'representative.email': email,
  });

  if (getUserDoc?.docs?.length > 0) {
    [userDoc] = getUserDoc.docs;
    const getCommune = await fetchDocumentsByFilter({
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

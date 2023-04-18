import axios from 'axios';
import PouchAsyncStorage from 'pouchdb-adapter-asyncstorage';
import PouchAuth from 'pouchdb-authentication';
import PouchFind from 'pouchdb-find';
import PouchDB from 'pouchdb-react-native';

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

  const communesRemoteDB = new PouchDB('http://197.243.104.5/couchdb/eadls', {
    skip_setup: true,
  });

  await remoteDB.login(username, password);
  await grmRemoteDB.login(username, password);
  const sync = LocalDatabase.sync(remoteDB, {
    live: true,
    retry: true,
    filter: 'eadl/by_user_email',
    query_params: { email: userEmail },
  });

  function filterFunction(doc) {
    // Condition 1: Check if the document's 'user_email' field matches the user email from the request
    let administrativeRegion;
    if (!doc._deleted && doc.user_email === userEmail) {
      // Get the administrative region from the document
      administrativeRegion = doc.administrative_region;

      // Return true to include the document in the replication
      return true;
    }

    // Condition 2: Check if the document's 'administrative_id' field matches the administrative region of the user's document
    if (!doc._deleted && doc.administrative_id === administrativeRegion) {
      // Return true to include the document in the replication
      return true;
    }

    // Exclude the document from the replication
    return false;
  }

  const syncCommunes = LocalCommunesDatabase.sync(communesRemoteDB, {
    live: true,
    retry: true,
    // view: "eadl/all_administrative_levels",
    filter: filterFunction,
    // query_params: { usrEmail: userEmail },
  });

  const syncGRM = LocalGRMDatabase.sync(grmRemoteDB, {
    live: true,
    retry: true,
  });
  const syncStates = ['change', 'paused', 'active', 'denied', 'complete', 'error'];
  syncStates.forEach((state) => {
    sync.on(state, (currState) => console.log(`[Sync EADL: `));

    syncCommunes.on(state, (currState) =>
      console.log(`[Sync COMMUNES: ${JSON.stringify(currState)}]`)
    );

    syncGRM.on(state, (currState) => console.log(`[Sync GRM: `));
  });
};

// Function to fetch documents from CouchDB with a Mango query
const fetchDocumentsByFilter = async (select) => {
  try {
    const response = await axios.post(
      `http://197.243.104.5/couchdb/eadls/_find`,
      {
        selector: select, // Specify the filter criteria as the Mango query selector
      },
      {
        auth: {
          username: 'admin', // CouchDB username
          password: 'c05orwshdwlauwwx', // CouchDB password
        },
        headers: {
          'Content-Type': 'application/json',
        },
        // Enable CORS in Axios request
        // Note: This assumes that your CouchDB server has CORS enabled and configured to allow requests from the origin of your React Native app.
        // You may need to adjust the CORS configuration on your CouchDB server accordingly.
        crossDomain: true,
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching documents by filter:', error);
    throw error;
  }
};

export const getUserDocs = async (email) => {
  const getUserDoc = await fetchDocumentsByFilter({
    'representative.email': email,
  });

  let userCommune;
  let userDoc;

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

  return { userDoc, userCommune };
};

export default LocalDatabase;

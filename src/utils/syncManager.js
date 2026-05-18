import NetInfo from "@react-native-community/netinfo";
import PouchAsyncStorage from 'pouchdb-adapter-asyncstorage';
import PouchAuth from 'pouchdb-authentication';
import PouchFind from 'pouchdb-find';
import PouchDB from 'pouchdb-react-native';
import { EventEmitter } from 'events';
EventEmitter.defaultMaxListeners = 30;

PouchDB.plugin(PouchAuth);
PouchDB.plugin(PouchFind);
PouchDB.plugin(require('pouchdb-upsert'));
PouchDB.plugin(PouchAsyncStorage);

let activeSyncs = {};  // Pour garder les références aux syncs actifs
// let externalStatusUpdater = null;

// export const setSyncStatusUpdater = (fn) => {
//     externalStatusUpdater = fn;
// };

const syncEvents = (label, syncHandler) => {
    syncHandler
        .on('change', info => {
            if (__DEV__) { console.log(`[${label}] Change:`, info); }
            // externalStatusUpdater?.(label, 'change');
        })
        .on('paused', err => {
            if (__DEV__) { console.log(`[${label}] Paused`, err || 'No error'); }
            // externalStatusUpdater?.(label, 'paused');
        })
        .on('active', () => {
            if (__DEV__) { console.log(`[${label}] Active`); }
            // externalStatusUpdater?.(label, 'active');
        })
        .on('denied', err => {
            if (__DEV__) { console.warn(`[${label}] Denied:`, err); }
            // externalStatusUpdater?.(label, 'denied');
        })
        .on('complete', info => {
            if (__DEV__) { console.log(`[${label}] Complete`, info); }
            externalStatusUpdater?.(label, 'complete');
        })
        .on('error', err => {
            if (__DEV__) { console.error(`[${label}] Error:`, err); }
            // externalStatusUpdater?.(label, 'error');
        });
};

// Annule une ancienne synchronisation proprement
const cancelSync = (label) => {
    if (activeSyncs[label]) {
        try {
            activeSyncs[label].cancel();
            if (__DEV__) console.log(`[${label}] Sync cancelled`);
        } catch (e) {
            if (__DEV__) console.warn(`[${label}] Cancel failed`, e);
        }
        delete activeSyncs[label];
    }
};

export const cancelAllSyncs = () => {
    Object.keys(activeSyncs).forEach(cancelSync);
};


const createRemoteDB = async (url, username, password) => {
    const db = new PouchDB(url, { skip_setup: true });
    await db.login(username, password);
    return db;
};

export const startSync = async ({
    localDB,
    remoteURL,
    username,
    password,
    label,
    filter = null,
    query_params = null,
}) => {

    // Évite les syncs concurrentes
    // if (activeSyncs[label]) {
    //     if (__DEV__) console.log(`[${label}] Sync already in progress`);
    //     return;
    // }


    cancelSync(label);

    const remoteDB = await createRemoteDB(remoteURL, username, password);
    console.log(remoteURL)
    const syncConfig = {
        live: true,
        retry: true,
    };
    if (filter) {
        syncConfig.filter = filter;
        syncConfig.query_params = query_params;
    }

    const syncHandler = localDB.sync(remoteDB, syncConfig);
    activeSyncs[label] = syncHandler;

    // Nettoie après fin ou erreur
    syncHandler.on('complete', () => {
        if (__DEV__) console.log(`[${label}] Sync complete`);
        delete activeSyncs[label]; // Libère la place pour un prochain
    });

    syncHandler.on('error', (err) => {
        if (__DEV__) console.error(`[${label}] Sync error`, err);
        delete activeSyncs[label]; // Libère même en cas d’erreur
    });


    syncEvents(label, syncHandler);


};

export const syncAllDatabases = async ({ username, password, eadl, userEmail, couchDBURLBase, localDBs }) => {
    try {
        await startSync({
            localDB: localDBs.LocalDatabase,
            remoteURL: `${couchDBURLBase}/eadls`,
            username,
            password,
            label: 'EADL',
            filter: 'eadl/by_user_email',
            query_params: { email: userEmail },
        });

        const grmFilter = (eadl?.administrative_region === "1")
            ? null
            : 'issues/exclude_unrelated_issues';

        const grmParams = (eadl?.administrative_region === "1")
            ? null
            : { user_id: eadl?.representative?.id };
        console.log("============uuu===")
        await startSync({
            localDB: localDBs.LocalGRMDatabase,
            remoteURL: `${couchDBURLBase}/grm`,
            username,
            password,
            label: 'GRM',
            filter: grmFilter,
            query_params: grmParams,
        });
    } catch (e) {
        console.log("==========================================================")
        if (__DEV__) console.error("Sync failed:", e);
    }
};

// redémarre la sync automatiquement quand Internet revient
global.__isNetworkListenerSet = false;
export const setupNetworkSyncAutoRestart = (syncTriggerFn, count) => {
    if (global.__isNetworkListenerSet || count == 1) return; // évite les multiples listeners
    NetInfo.addEventListener(state => {
        if (!global.__isNetworkListenerSet && state.isConnected) {
            if (__DEV__) { console.log("Internet back. Restarting sync..."); }
            syncTriggerFn();
        }
    });
    global.__isNetworkListenerSet = true;
};

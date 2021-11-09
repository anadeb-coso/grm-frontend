import React from "react";
import PouchDB from "pouchdb-react-native";
import PouchAuth from "pouchdb-authentication";
import PouchFind from "pouchdb-find";
import PouchAsyncStorage from "pouchdb-adapter-asyncstorage";

PouchDB.plugin(PouchAuth);
PouchDB.plugin(PouchFind);
PouchDB.plugin(require("pouchdb-upsert"));
PouchDB.plugin(PouchAsyncStorage);

const LocalDatabase = new PouchDB("eadl", {
  adapter: "asyncstorage",
});

export const LocalGRMDatabase = new PouchDB("grm", {
  adapter: "asyncstorage",
});

export const LocalCommunesDatabase = new PouchDB("commune", {
  adapter: "asyncstorage",
});

export const SyncToRemoteDatabase = async (
  { username, password },
  userEmail
) => {
  const remoteDB = new PouchDB("http://206.81.23.161:5984/eadls", {
    skip_setup: true,
  });

  const grmRemoteDB = new PouchDB("http://206.81.23.161:5984/grm", {
    skip_setup: true,
  });

  const communesRemoteDB = new PouchDB("http://206.81.23.161:5984/eadls", {
    skip_setup: true,
  });

  await remoteDB.login(username, password);
  await grmRemoteDB.login(username, password);
  const sync = LocalDatabase.sync(remoteDB, {
    live: true,
    retry: true,
    // filter: "eadl/by_user_email",
    // query_params: { email: userEmail },
  });

  const syncCommunes = LocalCommunesDatabase.sync(communesRemoteDB, {
    live: true,
    retry: true,
    // view: "eadl/all_administrative_levels",
    // filter: "eadl/all_communes",
    // query_params: { email: userEmail },
  });

  const syncGRM = LocalGRMDatabase.sync(grmRemoteDB, {
    live: true,
    retry: true,
  });
  const syncStates = [
    "change",
    "paused",
    "active",
    "denied",
    "complete",
    "error",
  ];
  syncStates.forEach((state) => {
    sync.on(state, (currState) =>
      console.log(`[Sync: ${JSON.stringify(currState)}]`)
    );

    syncCommunes.on(state, (currState) =>
      console.log(`[Sync: ${JSON.stringify(currState)}]`)
    );

    syncGRM.on(state, (currState) =>
      console.log(`[Sync GRM: ${JSON.stringify(currState)}]`)
    );
  });
};

export default LocalDatabase;

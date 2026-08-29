import { Map } from "immutable";
import { createActions, handleActions } from "redux-actions";
import { startWatermelonSync, stopWatermelonSync } from "../../database/watermelonSyncManager";
import { clearLocalAdls } from "../../database/sync";
import { logout as jwtLogout } from "../../api/client";
import {
  clearEncryptedValues,
  storeEncryptedData,
} from '../../utils/storageManager';

const defaultState = Map({
  isAuthenticated: false,
  username: null,
});

// `dbCredentials`/`SyncToRemoteDatabase` (réplication CouchDB/PouchDB) sont retirés du flux
// d'authentification : la connexion se fait désormais par JWT (src/api/client.js::login,
// appelé par l'écran avant de dispatcher ces actions — les tokens sont déjà stockés à ce
// stade, sous une clé propre à `api/client.js`). `startWatermelonSync()` remplace
// `SyncToRemoteDatabase()` pour déclencher le premier pull WatermelonDB juste après connexion.
//
// Le store ne conserve plus le mot de passe de l'utilisateur (ni en mémoire ni en stockage
// chiffré) : `isAuthenticated` est l'unique indicateur de session, restauré au démarrage par
// `router/index.js::restoreSession` d'après la présence d'un token JWT valide plutôt que d'après
// un mot de passe mis de côté à cet effet (cf. databaseManager.js::getUserDocs, qui n'a plus
// besoin non plus du mot de passe pour rafraîchir le profil ADL).
export const { init, login, signUp, logout } = createActions({
  INIT: (credentials) => {
    startWatermelonSync();
    return { username: credentials.email };
  },
  LOGIN: (credentials) => {
    storeEncryptedData(`username`, credentials.email);
    startWatermelonSync();
    return { username: credentials.email };
  },
  SIGN_UP: (credentials) => {
    storeEncryptedData(`username`, credentials.email);
    startWatermelonSync();
    return { username: credentials.email };
  },
  LOGOUT: () => {
    stopWatermelonSync();
    jwtLogout();
    clearEncryptedValues()
    // Table locale `adls` : ne doit contenir que le facilitateur actuellement connecté sur cet
    // appareil (cf. database/sync.js::clearLocalAdls) — vidée à la déconnexion pour ne pas
    // exposer son profil à un compte différent qui se connecterait ensuite sur le même appareil.
    clearLocalAdls();
    return { username: null };
  },
});

const authentication = handleActions(
  {
    [init]: (draft, { payload: { username } }) => {
      return draft.withMutations((state) => {
        state.set("isAuthenticated", true);
        state.set("username", username);
      });
    },
    [login]: (draft, { payload: { username } }) => {
      return draft.withMutations((state) => {
        state.set("isAuthenticated", true);
        state.set("username", username);
      });
    },
    [signUp]: (draft, { payload: { username } }) => {
      return draft.withMutations((state) => {
        state.set("isAuthenticated", true);
        state.set("username", username);
      });
    },
    [logout]: (draft) => {
      return draft.withMutations((state) => {
        state.set("isAuthenticated", false);
        state.set("username", null);
      });
    },
  },
  defaultState
);

export default authentication;

import axios from 'axios';
import { Buffer } from 'buffer';
import NetInfo from '@react-native-community/netinfo';
import { Toast } from 'react-native-toast-notifications';

import { grmBaseURL } from '../services/env';
import { getEncryptedData, storeEncryptedData, removeEncryptedValue } from '../utils/storageManager';
import i18n from '../translations/i18n';

const TOKENS_KEY = 'jwtTokens';
const CONNECTIVITY_TOAST_ID = 'api-connectivity-issue';

export const api = axios.create({ baseURL: `${grmBaseURL}/api` });
// Certains endpoints legacy (ex. `authentication/`) sont montés à la racine, pas sous `/api/` —
// cf. grm-backend/src/grm/urls.py. Même comportement que `api` (JWT + refresh automatique,
// interceptors partagés plus bas) mais avec ce préfixe différent, pour éviter de dupliquer le
// header `Authorization` à la main dans services/API.js (cf. databaseManager.js::getUserDocs).
export const rootApi = axios.create({ baseURL: grmBaseURL });

/**
 * Vérifie que le serveur répond avant de tenter une synchronisation (`watermelonSyncManager.js`
 * ::runSyncSafely) — évite de lancer un `synchronize()` WatermelonDB voué à échouer (ou pire, à
 * traîner en timeout réseau) quand le serveur est simplement indisponible (maintenance, backend
 * arrêté...). `GET /health/` est un endpoint non authentifié, hors `/api/`, qui répond juste le
 * texte brut "ok" (cf. grm-backend/src/grm/urls.py) — un `axios` brut suffit, pas besoin des
 * intercepteurs JWT de `api`/`rootApi`. Timeout court et volontairement silencieux (pas de toast
 * ici) : c'est un simple filet, l'appelant décide quoi faire du résultat.
 */
export async function isServerHealthy() {
  try {
    const { data } = await axios.get(`${grmBaseURL}/health/`, { timeout: 5000 });
    return typeof data === 'string' && data.trim().toLowerCase() === 'ok';
  } catch (err) {
    return false;
  }
}

export async function getTokens() {
  return getEncryptedData(TOKENS_KEY);
}

export async function saveTokens(tokens) {
  await storeEncryptedData(TOKENS_KEY, tokens);
}

export async function clearTokens() {
  await removeEncryptedValue(TOKENS_KEY);
}

/** Décode la charge utile (payload) du JWT d'accès courant — simplejwt y inclut `user_id` par
 * défaut, ce qui permet de retrouver localement l'`Adl` (facilitateur) de l'utilisateur connecté
 * sans dépendre d'une requête réseau ni d'une table `users` locale (aucune n'existe dans le
 * schéma WatermelonDB, cf. database/schema.js). */
export async function getCurrentUserId() {
  const tokens = await getTokens();
  if (!tokens?.access) return null;
  try {
    const payloadBase64 = tokens.access.split('.')[1];
    const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
    return JSON.parse(payloadJson).user_id ?? null;
  } catch (err) {
    return null;
  }
}

export async function login(username, password) {
  const { data } = await axios.post(`${grmBaseURL}/api/auth/token/`, { username, password });
  await saveTokens({ access: data.access, refresh: data.refresh });
  return data;
}

export async function logout() {
  const tokens = await getTokens();
  if (tokens?.refresh) {
    try {
      await axios.post(`${grmBaseURL}/api/auth/token/blacklist/`, { refresh: tokens.refresh });
    } catch (err) {
      // best-effort : on déconnecte localement même si le blacklist serveur échoue (hors-ligne)
    }
  }
  await clearTokens();
}

/**
 * Callback branché par `router/index.js` (seul endroit qui a accès au store redux) pour
 * déconnecter réellement l'utilisateur (dispatch de l'action `logout` du duck `authentication`)
 * quand la session expire côté serveur. Un simple callback plutôt qu'un import direct du store
 * ici : `store/ducks/authentication.duck.js` importe déjà ce module (`jwtLogout`), un import
 * retour créerait une dépendance circulaire.
 */
let onSessionExpired = null;
export function setOnSessionExpired(callback) {
  onSessionExpired = callback;
}

const SESSION_TOAST_ID = 'api-session-expired';

function handleSessionExpired() {
  Toast?.show(i18n.t('session_expired_please_login'), { id: SESSION_TOAST_ID, type: 'danger', duration: 5000, placement: 'top' });
  if (onSessionExpired) onSessionExpired();
}

export class ApiRequestBlockedError extends Error {}

/**
 * Vérifie, avant tout appel API, que l'appareil a vraiment accès à internet ET (sauf pour les
 * endpoints d'authentification eux-mêmes, `requireAuth: false`) que l'utilisateur dispose d'un
 * token d'accès — sans ça, autant échouer tout de suite avec un message clair plutôt que de
 * laisser la requête partir pour finir en timeout réseau ou en 401 générique. Réutilisée à la
 * fois par l'interceptor axios (`api`) et par `services/API.js` (client `fetch` historique,
 * pré-WatermelonDB). Utilise un `id` de toast fixe : plusieurs appels échouant coup sur coup
 * (ex. plusieurs pages de pull, plusieurs uploads) mettent à jour le même toast au lieu de les
 * empiler.
 */
export async function ensureRequestAllowed({ requireAuth = true } = {}) {
  const netState = await NetInfo.fetch();
  if (!netState.isConnected) {
    Toast?.show(i18n.t('unable_access_wifi'), { id: CONNECTIVITY_TOAST_ID, type: 'danger', duration: 5000, placement: 'top' });
    throw new ApiRequestBlockedError('No network connection');
  }
  if (netState.isInternetReachable === false) {
    Toast?.show(i18n.t('unable_access_internet'), { id: CONNECTIVITY_TOAST_ID, type: 'danger', duration: 5000, placement: 'top' });
    throw new ApiRequestBlockedError('Internet not reachable');
  }

  if (!requireAuth) return null;

  const tokens = await getTokens();
  if (!tokens?.access) {
    handleSessionExpired();
    throw new ApiRequestBlockedError('User not authenticated');
  }
  return tokens;
}

let refreshPromise = null;

/**
 * Rafraîchit l'access token à partir du refresh token stocké et sauvegarde le nouveau couple.
 * Mutualisé (un seul refresh en vol à la fois, via `refreshPromise`) et réutilisé à la fois par
 * l'intercepteur axios ci-dessous (401 sur `api`/`rootApi`) et par le flux d'upload de pièces
 * jointes (`files/uploadQueue.js`), qui passe par `expo-file-system.uploadAsync` — donc en dehors
 * d'axios, sans intercepteur possible — et doit donc appeler ce helper lui-même sur un 401 (accès
 * de courte durée de vie côté Django, `ACCESS_TOKEN_LIFETIME`, cf. CLAUDE.md §4.1/grm-backend
 * settings.py : une synchronisation en tâche de fond qui dure au-delà, ou reprise après une
 * pause, tombait systématiquement sur un token expiré sans jamais le rafraîchir).
 *
 * IMPORTANT : `SIMPLE_JWT.ROTATE_REFRESH_TOKENS` + `BLACKLIST_AFTER_ROTATION` sont activés côté
 * Django (settings.py) — chaque appel à `/auth/token/refresh/` renvoie donc, en plus du nouvel
 * access token, un NOUVEAU refresh token, et blackliste immédiatement l'ancien. Avant ce correctif,
 * on ignorait `data.refresh` et on ré-enregistrait l'ancien refresh token stocké : le premier
 * rafraîchissement fonctionnait, mais le suivant échouait alors systématiquement en 401 sur
 * `/auth/token/refresh/` lui-même (refresh token désormais blacklisté), forçant une déconnexion
 * complète de l'utilisateur alors que sa fenêtre de 14 jours n'était pas réellement expirée.
 *
 * Vide le stockage et déconnecte l'utilisateur (`handleSessionExpired`) si le refresh échoue
 * (refresh token lui-même absent/expiré/révoqué) — l'appelant reçoit alors l'erreur d'origine.
 */
export async function refreshAccessToken() {
  const tokens = await getTokens();
  if (!tokens?.refresh) {
    await clearTokens();
    handleSessionExpired();
    throw new Error('No refresh token available');
  }

  try {
    // Mutualise les refresh concurrents (évite plusieurs requêtes de refresh en parallèle)
    refreshPromise = refreshPromise ?? axios
      .post(`${grmBaseURL}/api/auth/token/refresh/`, { refresh: tokens.refresh })
      .finally(() => { refreshPromise = null; });

    const { data } = await refreshPromise;
    // `data.refresh` : présent quand ROTATE_REFRESH_TOKENS est actif (toujours le cas ici, voir
    // note ci-dessus) — on le garde en priorité ; retombe sur l'ancien seulement si l'API ne
    // renvoie pas de nouveau refresh token (rotation désactivée côté serveur).
    const newTokens = { access: data.access, refresh: data.refresh ?? tokens.refresh };
    await saveTokens(newTokens);
    return newTokens;
  } catch (refreshError) {
    // Refresh token expiré/révoqué : on vide le stockage et on déconnecte l'utilisateur
    // (redirection automatique vers l'écran de connexion, cf. handleSessionExpired) plutôt
    // que de le laisser bloqué sur un écran qui ne synchronisera plus jamais.
    await clearTokens();
    handleSessionExpired();
    throw refreshError;
  }
}

// Fabrique le handler d'erreur 401 lié à `instance` (plutôt qu'un seul handler figé sur `api`) :
// la requête rejouée après refresh doit repartir sur l'instance qui l'a émise à l'origine
// (`api` ou `rootApi`, baseURL différentes).
function createAuthErrorHandler(instance) {
  return async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const newTokens = await refreshAccessToken();
      originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;
      return instance(originalRequest);
    }
    return Promise.reject(error);
  };
}

[api, rootApi].forEach((instance) => {
  instance.interceptors.request.use(async (config) => {
    const tokens = await ensureRequestAllowed();
    config.headers.Authorization = `Bearer ${tokens.access}`;
    return config;
  });
  instance.interceptors.response.use((response) => response, createAuthErrorHandler(instance));
});

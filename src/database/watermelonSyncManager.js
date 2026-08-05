import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

import { runSync } from './sync';
import { syncAdministrativeLevels } from './syncAdministrativeLevels';
import { isServerHealthy } from '../api/client';

// Tant que l'application est au premier plan, on veut une sync très fréquente pour récupérer les
// mises à jour (statuts changés par un autre agent, nouveaux commentaires, etc.) sans que
// l'utilisateur ait à quitter l'écran. En arrière-plan, un intervalle bien plus espacé suffit (et
// évite de vider la batterie/les données mobiles pour rien tant que personne ne regarde l'écran).
const FOREGROUND_SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const BACKGROUND_SYNC_INTERVAL_MS = 1 * 60 * 60 * 1000; // 1 heure
const ADMINISTRATIVE_LEVELS_INTERVAL_MS = 24 * 60 * 60 * 1000; // 1 fois par jour (CLAUDE.md §4.7)

let syncPromise = null;
let administrativeLevelsSyncPromise = null;
let intervalHandle = null;
let administrativeLevelsIntervalHandle = null;
let netInfoUnsubscribe = null;
let appStateSubscription = null;
let lastAppState = AppState.currentState;
// Initialisé à `true` : `startWatermelonSync()` déclenche déjà une sync explicite juste avant de
// s'abonner (voir plus bas), donc on ne veut pas qu'un premier événement NetInfo "toujours
// connecté" en déclenche une redondante.
let wasConnected = true;
// Protège `startWatermelonSync()` contre les appels multiples (ex. React StrictMode qui double-
// invoque les `useEffect` en dev, ou toute autre source de double dispatch de l'action `login`/
// `init` — cf. store/ducks/authentication.duck.js, où `startWatermelonSync()` est appelé comme
// effet de bord de l'action creator). Sans cette garde, un second appel recréait un second
// intervalle de 30s en plus du premier (les deux vivant en parallèle), doublant chaque requête de
// sync — c'est ce qui causait l'erreur WatermelonDB "Concurrent synchronization is not allowed"
// et les requêtes /api/sync/pull/ observées deux fois de suite avec le même `last_pulled_at`.
let isStarted = false;

// Pub/sub minimaliste (pas de dépendance à Redux depuis ce module non-React) : permet à un
// composant monté une seule fois à la racine de l'app (cf. components/SyncProgressBar) d'afficher
// une barre de progression en haut de l'écran pendant qu'une synchronisation est en cours, sans
// que ce module ait besoin de connaître React.
const syncingListeners = new Set();
let isSyncingGlobally = false;

function setGlobalSyncing(value) {
  if (isSyncingGlobally === value) return;
  isSyncingGlobally = value;
  syncingListeners.forEach((listener) => listener(value));
}

/** `listener` est appelé immédiatement avec l'état courant (utile si une sync est déjà en cours
 * au moment où le composant se monte), puis à chaque changement. Retourne la fonction de
 * désabonnement. */
export function subscribeSyncStatus(listener) {
  syncingListeners.add(listener);
  listener(isSyncingGlobally);
  return () => syncingListeners.delete(listener);
}

/**
 * Protège contre les appels concurrents (retour réseau + bouton manuel + intervalle en même
 * temps), et prévient l'UI (barre de progression globale, cf. `subscribeSyncStatus`) tant que la
 * synchronisation (déclenchée en arrière-plan : login, retour réseau, intervalle périodique) est
 * en cours — auparavant totalement silencieuse côté UI (seul un `console.log` en __DEV__
 * signalait quoi que ce soit). La barre globale est sautée si `onProgress` est fourni : c'est le
 * signal que l'appelant (écran `SyncDatas`) affiche déjà son propre indicateur dédié, pour éviter
 * un double affichage redondant.
 *
 * Verrou basé sur une promesse partagée (`syncPromise`) plutôt qu'un simple booléen : un appelant
 * qui arrive pendant qu'une sync est déjà en cours attend et reçoit le résultat de CETTE sync-là
 * au lieu d'un no-op silencieux. Ce verrou empêche aussi, à la source, l'erreur WatermelonDB
 * "Concurrent synchronization is not allowed" (deux `synchronize()` lancés en même temps).
 *
 * Vérifie d'abord `/health/` (cf. api/client.js::isServerHealthy) : si le serveur ne répond pas
 * "ok", la synchronisation est abandonnée immédiatement, sans même tenter `runSync` (qui aurait de
 * toute façon échoué, mais après un timeout réseau potentiellement long). Cette vérification est
 * faite À L'INTÉRIEUR de la promesse partagée (et non avant de l'assigner) : la faire avant
 * aurait laissé une fenêtre où deux appels concurrents passent tous les deux le test
 * `if (syncPromise)` pendant que le premier attend encore la réponse de `/health/`, recréant
 * exactement la race condition que ce verrou est censé éliminer.
 *
 * Résout toujours vers `true`/`false` (jamais de rejet, pour rester sûr à utiliser en
 * fire-and-forget — intervalle, retour réseau/premier plan) : `true` si `runSync` a abouti,
 * `false` sinon (serveur indisponible compris). Les appelants qui n'ont pas besoin de le savoir
 * (la plupart) ignorent simplement la valeur de retour ; ceux qui en ont besoin (ex. SyncDatas.js,
 * pour distinguer succès/échec de la synchronisation manuelle) peuvent l'attendre.
 */
export async function runSyncSafely(options) {
  if (syncPromise) return syncPromise;

  syncPromise = (async () => {
    const showGlobalIndicator = !options?.onProgress;
    try {
      const healthy = await isServerHealthy();
      if (!healthy) {
        if (__DEV__) console.log('[WatermelonSync] serveur indisponible (/health/), synchronisation annulée');
        return false;
      }

      if (showGlobalIndicator) setGlobalSyncing(true);
      try {
        await runSync(options);
        return true;
      } catch (err) {
        if (__DEV__) console.error('[WatermelonSync] échec', err);
        return false;
      } finally {
        if (showGlobalIndicator) setGlobalSyncing(false);
      }
    } finally {
      syncPromise = null;
    }
  })();

  return syncPromise;
}

async function runAdministrativeLevelsSyncSafely() {
  try {
    await syncAdministrativeLevels();
  } catch (err) {
    if (__DEV__) console.error('[AdministrativeLevelsSync] échec', err);
  }
}

/**
 * Déclenche (ou rejoint, si déjà en cours) une tentative de synchronisation des niveaux
 * administratifs, et attend son issue — succès ou échec, peu importe : l'objectif n'est pas de
 * garantir que le cache local `administrative_regions` est à jour, seulement qu'une tentative a
 * eu le temps de se dérouler avant de lire ce cache. Utilisé par `databaseManager.js::getUserDocs`
 * (donc par tous les écrans qui affichent des localités, ex. CitizenReportLocationStep) pour ne
 * pas lire un cache encore vide/partiel juste après le login, pendant que `startWatermelonSync()`
 * lance cette même synchronisation en arrière-plan (verrou par promesse partagée, comme
 * `runSyncSafely` ci-dessus, pour ne jamais lancer deux tentatives en parallèle).
 */
export function ensureAdministrativeLevelsSynced() {
  if (!administrativeLevelsSyncPromise) {
    administrativeLevelsSyncPromise = runAdministrativeLevelsSyncSafely().finally(() => {
      administrativeLevelsSyncPromise = null;
    });
  }
  return administrativeLevelsSyncPromise;
}

// (Re)démarre l'intervalle périodique avec la période adaptée à l'état courant de l'app — 30s au
// premier plan, 10 min en arrière-plan. Appelée à chaque transition AppState pour ne jamais rester
// bloquée sur l'ancienne période.
function restartSyncInterval() {
  clearInterval(intervalHandle);
  const periodMs = lastAppState === 'active' ? FOREGROUND_SYNC_INTERVAL_MS : BACKGROUND_SYNC_INTERVAL_MS;
  intervalHandle = setInterval(runSyncSafely, periodMs);
}

/**
 * Démarre : sync au lancement, sur retour réseau, sur un intervalle régulier (30s au premier plan,
 * 10 min en arrière-plan, cf. `restartSyncInterval`), et sur un retour au premier plan (pour ne pas
 * attendre jusqu'à 30s avant de rafraîchir un écran qu'on vient de rouvrir) — plus une sync séparée
 * et plus espacée des niveaux administratifs (CLAUDE.md §10, item 4).
 *
 * Les deux syncs sont enchaînées plutôt que lancées en parallèle : WatermelonDB sérialise tous
 * les lecteurs/écrivains d'une base sur une seule file (`WorkQueue`), et `syncAdministrativeLevels`
 * peut retenir l'écrivain unique un moment (jusqu'à 1000 enregistrements par page) — lancées en
 * même temps au démarrage, elles se font concurrence sur cette file et déclenchent le warning
 * WatermelonDB "The writer you're trying to run (...) can't be performed yet, because there are N
 * other readers/writers in the queue" (bénin en soi, mais évitable ici).
 */
export function startWatermelonSync() {
  // Garde d'idempotence globale (voir la déclaration de `isStarted` plus haut) : un second appel
  // ne fait plus rien du tout, plutôt que de re-vérifier chaque ressource individuellement (ce que
  // faisaient déjà les gardes `if (!intervalHandle)` etc. ci-dessous, mais qui ne suffisaient pas
  // à empêcher `runSyncSafely()` d'être relancé une seconde fois juste en dessous).
  if (isStarted) return;
  isStarted = true;

  runSyncSafely().then(() => ensureAdministrativeLevelsSynced());

  if (!netInfoUnsubscribe) {
    netInfoUnsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = Boolean(state.isConnected);
      // NetInfo peut émettre plusieurs événements "connecté" coup sur coup pendant qu'une
      // connexion se stabilise (observé notamment sur Android) — sans cette garde, chacun
      // relançait `runSyncSafely()` (sans dégât grâce au verrou, mais avec un log répété à
      // chaque fois). On ne réagit donc que sur une vraie transition déconnecté -> connecté.
      if (isConnected && !wasConnected) {
        if (__DEV__) console.log('[WatermelonSync] réseau de retour, relance de la synchronisation');
        runSyncSafely();
      }
      wasConnected = isConnected;
    });
  }

  if (!appStateSubscription) {
    lastAppState = AppState.currentState;
    appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      const wasActive = lastAppState === 'active';
      const isActive = nextAppState === 'active';
      lastAppState = nextAppState;
      if (isActive === wasActive) return; // même "camp" (ex. 'inactive' -> 'background') : rien à changer

      restartSyncInterval();
      if (isActive) {
        // Retour au premier plan depuis l'arrière-plan : on ne fait pas attendre l'utilisateur
        // jusqu'à 30s pour la prochaine sync, l'écran qu'il vient de rouvrir doit se rafraîchir
        // tout de suite.
        if (__DEV__) console.log('[WatermelonSync] app au premier plan, relance de la synchronisation');
        runSyncSafely();
      }
    });
  }

  if (!intervalHandle) {
    restartSyncInterval();
  }
  if (!administrativeLevelsIntervalHandle) {
    administrativeLevelsIntervalHandle = setInterval(
      ensureAdministrativeLevelsSynced, ADMINISTRATIVE_LEVELS_INTERVAL_MS,
    );
  }
}

export function stopWatermelonSync() {
  isStarted = false;
  netInfoUnsubscribe?.();
  netInfoUnsubscribe = null;
  appStateSubscription?.remove();
  appStateSubscription = null;
  clearInterval(intervalHandle);
  intervalHandle = null;
  clearInterval(administrativeLevelsIntervalHandle);
  administrativeLevelsIntervalHandle = null;
  wasConnected = true;
}

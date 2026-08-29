import { useEffect, useRef } from 'react';

import { subscribeSyncStatus } from './watermelonSyncManager';

/**
 * Rejoue `onSyncComplete` chaque fois qu'une synchronisation déclenchée en arrière-plan
 * (intervalle périodique, retour réseau, retour au premier plan — cf. watermelonSyncManager.js)
 * vient de se terminer, détecté via la transition "en cours -> terminée" du statut global de sync
 * exposé par `subscribeSyncStatus`.
 *
 * Sert aux écrans qui affichent une issue déjà chargée (IssueDetail, IssueActions) ou une liste
 * d'issues (IssueSearch) : la ligne SQLite sous-jacente est bien mise à jour par le sync, mais
 * rien ne rafraîchissait ensuite l'écran. `onSyncComplete` doit se contenter de relire la base
 * locale (jamais rappeler `runSyncSafely()`, sous peine de boucle de synchronisation).
 *
 * Le callback est stocké dans un `ref` : l'abonnement n'est mis en place qu'une fois (au montage)
 * et appelle toujours la dernière version de la fonction, sans avoir à se ré-abonner à chaque
 * rendu ni exiger que l'appelant mémoïse son callback.
 */
export function useSyncCompletion(onSyncComplete) {
  const callbackRef = useRef(onSyncComplete);
  callbackRef.current = onSyncComplete;

  useEffect(() => {
    // `subscribeSyncStatus` appelle immédiatement le listener avec l'état courant : si une sync est
    // déjà en cours au montage, `wasSyncing` passe à `true` sans déclencher le callback, qui ne
    // partira qu'à la vraie transition `true -> false`.
    let wasSyncing = false;
    return subscribeSyncStatus((syncing) => {
      if (wasSyncing && !syncing) {
        Promise.resolve(callbackRef.current?.()).catch((err) => {
          if (__DEV__) console.warn('[useSyncCompletion] échec du rafraîchissement post-sync', err);
        });
      }
      wasSyncing = syncing;
    });
  }, []);
}

// Pub/sub minimaliste entre sync.js (module non-React, sans i18n) et l'UI : signale les
// enregistrements refusés par le serveur au push (cf. sync.js::purgeRejectedRecords), pour que
// l'UI puisse prévenir l'utilisateur dans sa langue (screens/Home/router.js).
const rejectedListeners = new Set();

/** `listener(rejected)` où `rejected` = { [tableName]: [ids] }. Retourne le désabonnement. */
export function subscribeRejectedRecords(listener) {
  rejectedListeners.add(listener);
  return () => rejectedListeners.delete(listener);
}

export function emitRejectedRecords(rejected) {
  rejectedListeners.forEach((listener) => listener(rejected));
}

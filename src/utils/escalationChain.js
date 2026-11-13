/**
 * Chaîne de remontée des plaintes : Village -> Canton -> Commune -> National (même règle côté web,
 * grm-backend/src/authentication/models.py::get_adl_to_escalate). Une plainte déjà en Préfecture
 * ou en Région (anciennes règles) y reste ; sa prochaine remontée va au National.
 */
export const COUNTRY_LEVEL = { administrative_level: 'Country', administrative_id: null, name: 'TOGO' };

/**
 * Niveau de la prochaine remontée.
 * @param current `{ administrative_level, administrative_id }` du niveau actuel de la plainte
 * @param getParent `async (administrativeId) => { type, name, serverId } | null` (hiérarchie locale)
 * @returns le niveau cible, `null` si la plainte est déjà au National, ou `undefined` si la
 *          hiérarchie locale ne permet pas de trouver le parent (erreur à signaler).
 */
export async function nextEscalationLevel(current, getParent) {
  const level = current?.administrative_level;

  if (level === 'Country') return null;
  if (level === 'Commune' || level === 'Prefecture' || level === 'Region') return COUNTRY_LEVEL;

  // Village (ou niveau de base) -> premier ancêtre Canton ; Canton -> premier ancêtre Commune.
  // Les niveaux intermédiaires inattendus sont sautés ; sans ancêtre trouvé -> National.
  const wanted = level === 'Canton' ? 'Commune' : 'Canton';
  let node = await getParent(current?.administrative_id);
  if (!node) return undefined;
  while (node) {
    if (node.type === wanted) {
      return { administrative_level: node.type, administrative_id: node.serverId ?? node.server_id, name: node.name };
    }
    if (node.type === 'Country') break;
    node = await getParent(node.serverId ?? node.server_id);
  }
  return COUNTRY_LEVEL;
}

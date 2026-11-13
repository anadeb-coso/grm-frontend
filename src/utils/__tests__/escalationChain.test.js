import { COUNTRY_LEVEL, nextEscalationLevel } from '../escalationChain';

// Hiérarchie de `mis` : Pays > Région > Préfecture > Commune > Canton > Village.
const LEVELS = {
  1: { type: 'Country', parent: null },
  2: { type: 'Region', parent: 1 },
  3: { type: 'Prefecture', parent: 2 },
  4: { type: 'Commune', parent: 3 },
  5: { type: 'Canton', parent: 4 },
  6: { type: 'Village', parent: 5 },
};
const getParent = async (id) => {
  const parentId = LEVELS[Number(id)]?.parent;
  return parentId ? { ...LEVELS[parentId], serverId: String(parentId), name: `L${parentId}` } : null;
};

describe('chaîne de remontée Village -> Canton -> Commune -> National', () => {
  it.each([
    ['Village', 6, 'Canton'],
    ['Canton', 5, 'Commune'],
    ['Commune', 4, 'Country'],
    ['Prefecture', 3, 'Country'], // ancien niveau : va au National
    ['Region', 2, 'Country'],     // ancien niveau : va au National
  ])('%s -> %s', async (level, id, expected) => {
    const next = await nextEscalationLevel({ administrative_level: level, administrative_id: id }, getParent);
    expect(next.administrative_level).toBe(expected);
  });

  it('donne le canton et la commune réels (identifiants de la hiérarchie)', async () => {
    expect(await nextEscalationLevel({ administrative_level: 'Village', administrative_id: 6 }, getParent))
      .toEqual({ administrative_level: 'Canton', administrative_id: '5', name: 'L5' });
    expect(await nextEscalationLevel({ administrative_level: 'Canton', administrative_id: 5 }, getParent))
      .toEqual({ administrative_level: 'Commune', administrative_id: '4', name: 'L4' });
  });

  it('ne remonte plus au-delà du National', async () => {
    expect(await nextEscalationLevel({ administrative_level: 'Country', administrative_id: 1 }, getParent)).toBeNull();
  });

  it('signale une hiérarchie locale incomplète', async () => {
    expect(await nextEscalationLevel({ administrative_level: 'Village', administrative_id: 999 }, getParent)).toBeUndefined();
  });

  it("va au National si aucun ancêtre Commune n'existe", async () => {
    const flat = async (id) => (Number(id) === 50 ? { type: 'Country', serverId: '1', name: 'TOGO' } : null);
    expect(await nextEscalationLevel({ administrative_level: 'Canton', administrative_id: 50 }, flat)).toEqual(COUNTRY_LEVEL);
  });
});

import { toLegacyIssueShape } from '../issueLegacyShape';
import { citizenTypes } from '../utils';

jest.mock('../../database', () => ({ database: {} })); // inutile ici : enregistrements simulés

const noRelation = { fetch: async () => null };

function issueWithCitizenType(citizenType) {
  return {
    id: 'issue-1', citizenType, status: noRelation, category: noRelation, ageGroup: null, issueType: noRelation,
  };
}

// `citizen_type` est stocké en chaîne (colonne `string`, comme côté serveur) ; les écrans
// comparent `issue.citizen_type === 1` pour masquer le nom d'un plaignant confidentiel.
describe('citizen_type dans la forme legacy', () => {
  it.each([['1', 1], ['3', 3], [null, null], ['', null]])('%p -> %p', async (stored, expected) => {
    expect((await toLegacyIssueShape(issueWithCitizenType(stored))).citizen_type).toBe(expected);
  });

  it('libellés « Inscrite par » alignés sur le web (CITIZEN_TYPE_CHOICES_ALT)', () => {
    expect(citizenTypes[1]).toBe('Complainant');
    expect(citizenTypes[2]).toBe('Citizen on behalf of others');
    expect(citizenTypes[3]).toBe('Organization on behalf of others');
  });
});

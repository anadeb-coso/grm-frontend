import 'fake-indexeddb/auto'; // requis par LokiJSAdapter (adapter de test, cf. database/index.js)

import { database } from '../index';

// `citizen_type` (choix de confidentialité de l'étape 2 de la collecte) est une colonne `string` :
// WatermelonDB y remplace par `null` toute valeur d'un autre type — d'où la conversion en chaîne
// à l'enregistrement (CitizenReportStep3) puis en entier à la lecture (utils/issueLegacyShape.js).
async function createIssue(citizenType) {
  let issue;
  await database.write(async () => {
    issue = await database.get('issues').create((r) => {
      r.internalCode = 'ISS-1';
      r.autoIncrementId = 1;
      r.description = 'Test';
      r.confirmed = true;
      r.source = 'mobile';
      r.publish = false;
      r.notificationSend = false;
      r.ongoingIssue = false;
      r.eventRecurrence = false;
      r.resolutionDays = 0;
      r.statusId = 'status-1';
      r.categoryId = 'cat-1';
      r.issueTypeId = 'type-1';
      r.administrativeRegionId = 2439;
      r.citizenType = citizenType;
    });
  });
  return issue;
}

describe('citizen_type à la collecte', () => {
  afterEach(async () => {
    await database.write(async () => database.unsafeResetDatabase());
  });

  it('perd un nombre (valeur brute des boutons radio)', async () => {
    expect((await createIssue(1)).citizenType).toBeNull();
  });

  it('conserve la valeur convertie en chaîne', async () => {
    expect((await createIssue(String(1))).citizenType).toBe('1');
  });
});

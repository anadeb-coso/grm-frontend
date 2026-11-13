import 'fake-indexeddb/auto'; // requis par LokiJSAdapter (adapter de test, cf. database/index.js)

import { database } from '../index';
import { addDelay, groupOverdueByVillage, loadOverdueIssues } from '../../utils/issueDeadlines';

// Plaintes en retard calculées localement (onglet Notifications), mêmes règles que le web
// (grm-backend/src/issue/deadlines.py).
const MONDAY = new Date(2026, 10, 2); // 2 novembre 2026

async function seed({ statusFlags = {}, receivedDate = MONDAY, escalation = null, village = 101 } = {}) {
  let issue;
  await database.write(async () => {
    const status = await database.get('issue_statuses').create((s) => {
      s.name = 'Statut';
      s.finalStatus = !!statusFlags.final;
      s.rejectedStatus = !!statusFlags.rejected;
    });
    issue = await database.get('issues').create((r) => {
      r.internalCode = `ISS-${Math.random()}`;
      r.autoIncrementId = 1;
      r.description = 'Test';
      r.confirmed = true;
      r.isDeleted = false;
      r.statusId = status.id;
      r.administrativeRegionId = village;
      r.administrativeRegionName = `Village ${village}`;
      r.receivedDate = receivedDate;
      r.intakeDate = receivedDate;
    });
    if (escalation) {
      await database.get('escalation_levels').create((el) => {
        el.issueId = issue.id;
        el.administrativeLevel = escalation.level;
        el.dueAt = new Date();
        el.escalationDate = escalation.date;
        el.isDeleted = false;
      });
    }
  });
  return issue;
}

async function seedDelays() {
  await database.write(async () => {
    const rows = [['Village', 10, true], ['Canton', 20, true], ['Commune', 20, true], ['Country', 45, false]];
    for (const [level, days, working] of rows) {
      await database.get('processing_delays').create((d) => {
        d.level = level;
        d.delayDays = days;
        d.workingDays = working;
        d.isDeleted = false;
      });
    }
  });
}

describe('délais de traitement (mobile)', () => {
  beforeEach(seedDelays);
  afterEach(async () => {
    await database.write(async () => database.unsafeResetDatabase());
  });

  it('compte les jours ouvrables (week-end exclu)', () => {
    expect(addDelay(MONDAY, 5, true)).toEqual(new Date(2026, 10, 9));
    expect(addDelay(MONDAY, 10, true)).toEqual(new Date(2026, 10, 16));
    expect(addDelay(MONDAY, 45, false)).toEqual(new Date(2026, 11, 17));
  });

  it('signale une plainte au Village en retard après 10 jours ouvrables', async () => {
    await seed();
    expect(await loadOverdueIssues(new Date(2026, 10, 16))).toHaveLength(0); // jour de l'échéance
    const overdue = await loadOverdueIssues(new Date(2026, 10, 19));
    expect(overdue).toHaveLength(1);
    expect(overdue[0].level).toBe('Village');
    expect(overdue[0].daysLate).toBe(3);
  });

  it("part de la date réelle d'escalade au Canton, et ignore les plaintes résolues", async () => {
    await seed({ escalation: { level: 'Canton', date: new Date(2026, 10, 20) } });
    await seed({ statusFlags: { final: true } });
    expect(await loadOverdueIssues(new Date(2026, 11, 1))).toHaveLength(0);
    const overdue = await loadOverdueIssues(new Date(2027, 0, 30));
    expect(overdue).toHaveLength(1);
    expect(overdue[0].level).toBe('Canton');
  });

  it('regroupe les retards par village', async () => {
    await seed({ village: 201 });
    await seed({ village: 201 });
    await seed({ village: 202 });
    const villages = groupOverdueByVillage(await loadOverdueIssues(new Date(2027, 0, 1)));
    expect(villages.map((v) => [v.villageId, v.count])).toEqual([['201', 2], ['202', 1]]);
  });
});

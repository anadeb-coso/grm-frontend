import { Database } from '@nozbe/watermelondb';
import { schema } from './schema';
import { migrations } from './migrations';

import Issue from './models/Issue';
import Comment from './models/Comment';
import IssueStatusStory from './models/IssueStatusStory';
import Reason from './models/Reason';
import EscalationReason from './models/EscalationReason';
import EscalationLevel from './models/EscalationLevel';
import Attachment from './models/Attachment';
import IssueStatus from './models/IssueStatus';
import IssueCategory from './models/IssueCategory';
import IssueAgeGroup from './models/IssueAgeGroup';
import IssueCitizenGroup1 from './models/IssueCitizenGroup1';
import IssueCitizenGroup2 from './models/IssueCitizenGroup2';
import IssueType from './models/IssueType';
import IssueDepartment from './models/IssueDepartment';
import AdministrativeRegion from './models/AdministrativeRegion';
import Adl from './models/Adl';
import Phase from './models/Phase';
import Task from './models/Task';
import BpProject from './models/BpProject';
import BudgetAllocationEntry from './models/BudgetAllocationEntry';

// Sous Jest, SQLiteAdapter nécessite des bindings natifs indisponibles dans l'environnement Node
// des tests : on bascule sur LokiJSAdapter (mémoire), l'adapter recommandé par WatermelonDB pour
// les tests unitaires. Le device réel utilise toujours SQLiteAdapter.
let adapter;
if (process.env.NODE_ENV === 'test') {
  // eslint-disable-next-line global-require
  const LokiJSAdapter = require('@nozbe/watermelondb/adapters/lokijs').default;
  adapter = new LokiJSAdapter({
    schema,
    migrations,
    useWebWorker: false,
    useIncrementalIndexedDB: false,
  });
} else {
  // eslint-disable-next-line global-require
  const SQLiteAdapter = require('@nozbe/watermelondb/adapters/sqlite').default;
  adapter = new SQLiteAdapter({
    schema,
    migrations,
    jsi: true, // meilleures perfs sur RN >= 0.66
    onSetUpError: (error) => {
      console.error('WatermelonDB setup error', error);
    },
  });
}

export const database = new Database({
  adapter,
  modelClasses: [
    Issue,
    Comment,
    IssueStatusStory,
    Reason,
    EscalationReason,
    EscalationLevel,
    Attachment,
    IssueStatus,
    IssueCategory,
    IssueAgeGroup,
    IssueCitizenGroup1,
    IssueCitizenGroup2,
    IssueType,
    IssueDepartment,
    AdministrativeRegion,
    Adl,
    Phase,
    Task,
    BpProject,
    BudgetAllocationEntry,
  ],
});

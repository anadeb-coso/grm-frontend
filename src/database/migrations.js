import { addColumns, createTable, schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

import {
  COMMENT_NOTIFICATION_COLUMNS, INTERNET_CREDIT_TABLE_DEFINITIONS, ISSUE_NOTIFICATION_TABLE_DEFINITION,
} from './schema';

export const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        // `IssueCategory.assigned_appeal_department`/`assigned_escalation_department` existent
        // côté backend depuis l'origine (issue/models.py) mais avaient été omis du schéma v1 —
        // cf. schema.js.
        addColumns({
          table: 'issue_categories',
          columns: [
            { name: 'assigned_appeal_department', type: 'string', isOptional: true },
            { name: 'assigned_escalation_department', type: 'string', isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 3,
      // Forfait internet CVGP. Les lignes déjà présentes côté serveur avant cette mise à jour
      // sont récupérées au pull suivant : WatermelonDB transmet `migration.tables`, que sync.js
      // relaie au serveur (`full_tables`) pour un envoi intégral de ces tables.
      steps: INTERNET_CREDIT_TABLE_DEFINITIONS.map((definition) => createTable(definition)),
    },
    {
      toVersion: 4,
      // Notifications des commentaires : options du commentaire écrit, et notifications du compte
      // connecté (récupérées en entier au pull suivant, via `migration.tables` comme en v3).
      steps: [
        addColumns({ table: 'comments', columns: COMMENT_NOTIFICATION_COLUMNS }),
        createTable(ISSUE_NOTIFICATION_TABLE_DEFINITION),
      ],
    },
  ],
});

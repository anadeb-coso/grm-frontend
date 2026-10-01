import { addColumns, createTable, schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

import { INTERNET_CREDIT_TABLE_DEFINITIONS } from './schema';

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
  ],
});

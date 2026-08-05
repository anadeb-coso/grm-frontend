import { addColumns, schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

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
  ],
});

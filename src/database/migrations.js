import { addColumns, createTable, schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

import {
  COMMENT_NOTIFICATION_COLUMNS, INTERNET_CREDIT_TABLE_DEFINITIONS, ISSUE_NOTIFICATION_TABLE_DEFINITION,
  PROCESSING_DELAY_TABLE_DEFINITION,
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
    {
      toVersion: 5,
      // Date réelle de la résolution sur le terrain, saisie à la mention de la résolution.
      steps: [
        addColumns({
          table: 'issues',
          columns: [{ name: 'resolution_real_issue_date', type: 'number', isOptional: true }],
        }),
      ],
    },
    {
      toVersion: 6,
      // Sexe du plaignant (statistiques « par acteur » de /diagnostics/ côté web).
      steps: [
        addColumns({
          table: 'issues',
          columns: [{ name: 'gender', type: 'string', isOptional: true }],
        }),
      ],
    },
    {
      toVersion: 7,
      // Le plaignant est-il un réfugié / PDI ? (étape 2 de l'enregistrement d'une plainte).
      steps: [
        addColumns({
          table: 'issues',
          columns: [{ name: 'refugee_or_idp', type: 'boolean', isOptional: true }],
        }),
      ],
    },
    {
      toVersion: 8,
      // Délais de traitement : date de réception, date réelle d'escalade, délais par niveau
      // (table récupérée en entier au pull suivant, via `migration.tables`).
      steps: [
        addColumns({ table: 'issues', columns: [{ name: 'received_date', type: 'number', isOptional: true }] }),
        addColumns({ table: 'escalation_levels', columns: [{ name: 'escalation_date', type: 'number', isOptional: true }] }),
        createTable(PROCESSING_DELAY_TABLE_DEFINITION),
      ],
    },
    {
      toVersion: 9,
      // Dates réelles d'acceptation / réouverture et d'investigation.
      steps: [
        addColumns({ table: 'issue_status_stories', columns: [{ name: 'action_date', type: 'number', isOptional: true }] }),
        addColumns({ table: 'reasons', columns: [{ name: 'action_date', type: 'number', isOptional: true }] }),
      ],
    },
  ],
});

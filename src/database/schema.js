import { appSchema, tableSchema } from '@nozbe/watermelondb';

// Les noms de colonnes des FK (`status`, `category`, `age_group`, `issue_type`, `assignee`,
// `reporter`, `administrative_region`...) correspondent volontairement aux noms de champs
// exposés par les serializers DRF côté backend (grm-backend/src/sync/serializers.py) — Django
// REST Framework nomme un PrimaryKeyRelatedField d'après le nom du champ FK, pas `<champ>_id`.
// Garder les mêmes noms des deux côtés évite une couche de traduction dans sync.js.
export const schema = appSchema({
  version: 2,
  tables: [
    tableSchema({
      name: 'issues',
      columns: [
        { name: 'internal_code', type: 'string', isIndexed: true },
        { name: 'tracking_code', type: 'string', isOptional: true },
        { name: 'auto_increment_id', type: 'number' },
        { name: 'description', type: 'string' },
        { name: 'confirmed', type: 'boolean' },
        { name: 'citizen', type: 'string', isOptional: true },
        { name: 'contact_medium', type: 'string', isOptional: true },
        { name: 'citizen_type', type: 'string', isOptional: true },
        { name: 'citizen_group_1', type: 'string', isOptional: true },
        { name: 'citizen_group_2', type: 'string', isOptional: true },
        { name: 'citizen_or_group', type: 'string', isOptional: true },
        { name: 'source', type: 'string' },
        { name: 'publish', type: 'boolean' },
        { name: 'publish_date', type: 'number', isOptional: true },
        { name: 'notification_send', type: 'boolean' },
        { name: 'ongoing_issue', type: 'boolean' },
        { name: 'event_recurrence', type: 'boolean' },
        { name: 'resolution_days', type: 'number' },
        { name: 'created_date', type: 'number' },
        { name: 'intake_date', type: 'number' },
        { name: 'issue_date', type: 'number' },
        { name: 'resolution_date', type: 'number', isOptional: true },
        { name: 'reject_date', type: 'number', isOptional: true },
        { name: 'research_result', type: 'string', isOptional: true },

        // FK vers les tables de référence : UUID (server_id des tables locales ci-dessous).
        { name: 'status', type: 'string', isIndexed: true },
        { name: 'category', type: 'string', isIndexed: true },
        { name: 'age_group', type: 'string', isOptional: true },
        { name: 'issue_type', type: 'string' },
        // `assignee`/`reporter` référencent authentication.User (pk entier BigAutoField, PAS un
        // UUID comme les autres FK ci-dessus qui pointent vers des TimestampedSyncModel).
        { name: 'assignee', type: 'number', isOptional: true },
        { name: 'assignee_name', type: 'string', isOptional: true },
        { name: 'reporter', type: 'number', isOptional: true },
        { name: 'reporter_name', type: 'string', isOptional: true },

        // FK cross-db côté serveur (base `mis`, entier — PAS un UUID, cf. CLAUDE.md §2.1).
        { name: 'administrative_region', type: 'number', isIndexed: true },
        { name: 'administrative_region_name', type: 'string', isOptional: true },

        // Objets "valeur" non normalisés -> JSON stringifié.
        { name: 'location_info', type: 'string', isOptional: true },
        { name: 'structure_in_charge', type: 'string', isOptional: true },
        { name: 'contact_information', type: 'string', isOptional: true },
        { name: 'commune', type: 'string', isOptional: true },

        // Workflow d'escalade — découvert lors de la bascule de IssueActions, absent du plan
        // initial. Historique détaillé dans les tables escalation_reasons/escalation_levels.
        { name: 'escalate_flag', type: 'boolean' },

        { name: 'is_deleted', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'comments',
      columns: [
        { name: 'issue', type: 'string', isIndexed: true },
        { name: 'author', type: 'number', isOptional: true }, // authentication.User (pk entier)
        { name: 'author_name', type: 'string', isOptional: true },
        { name: 'comment', type: 'string' },
        { name: 'due_at', type: 'number' },
        { name: 'is_deleted', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'issue_status_stories',
      columns: [
        { name: 'issue', type: 'string', isIndexed: true },
        { name: 'status', type: 'string' },
        { name: 'user', type: 'number', isOptional: true }, // authentication.User (pk entier)
        { name: 'user_full_name', type: 'string', isOptional: true },
        { name: 'comment', type: 'string', isOptional: true },
        { name: 'datetime', type: 'number' },
        { name: 'is_deleted', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'reasons',
      // couvre à la fois `reasons` et `resolution_files` côté CouchDB legacy (champ `subject`)
      columns: [
        { name: 'issue', type: 'string', isIndexed: true },
        { name: 'subject', type: 'string' }, // "resolution" | "reason" | ...
        { name: 'comment', type: 'string', isOptional: true },
        { name: 'user', type: 'number', isOptional: true }, // authentication.User (pk entier)
        { name: 'user_name', type: 'string', isOptional: true },
        { name: 'due_at', type: 'number', isOptional: true },
        { name: 'attachment', type: 'string', isOptional: true, isIndexed: true },
        { name: 'is_deleted', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'escalation_reasons',
      columns: [
        { name: 'issue', type: 'string', isIndexed: true },
        { name: 'user', type: 'number', isOptional: true }, // authentication.User (pk entier)
        { name: 'user_name', type: 'string', isOptional: true },
        { name: 'comment', type: 'string', isOptional: true },
        { name: 'due_at', type: 'number' },
        { name: 'attachment', type: 'string', isOptional: true, isIndexed: true },
        { name: 'is_deleted', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'escalation_levels',
      columns: [
        { name: 'issue', type: 'string', isIndexed: true },
        { name: 'administrative_level', type: 'string', isOptional: true },
        { name: 'administrative_id', type: 'number', isOptional: true },
        { name: 'name', type: 'string', isOptional: true },
        { name: 'due_at', type: 'number' },
        { name: 'is_deleted', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'attachments',
      columns: [
        { name: 'issue', type: 'string', isOptional: true, isIndexed: true },
        { name: 'task', type: 'string', isOptional: true, isIndexed: true }, // budgeting.Task (DocumentTask)
        { name: 'file_name', type: 'string' },
        { name: 'content_type', type: 'string' },
        { name: 'remote_url', type: 'string', isOptional: true },
        { name: 'local_uri', type: 'string', isOptional: true },
        { name: 'upload_status', type: 'string' }, // 'pending' | 'uploading' | 'done' | 'error'
        { name: 'download_status', type: 'string' }, // 'pending' | 'downloading' | 'done' | 'error'
        { name: 'size', type: 'number', isOptional: true },
        { name: 'is_deleted', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // ---- Tables de référence (lecture seule côté mobile, jamais de push) ----
    tableSchema({
      name: 'issue_statuses',
      columns: [
        { name: 'legacy_id', type: 'number', isOptional: true },
        { name: 'name', type: 'string' },
        { name: 'final_status', type: 'boolean' },
        { name: 'initial_status', type: 'boolean' },
        { name: 'rejected_status', type: 'boolean' },
        { name: 'open_status', type: 'boolean' },
        { name: 'unresolved_status', type: 'boolean' },
        { name: 'eligible_status', type: 'boolean' },
        { name: 'not_eligible_status', type: 'boolean' },
        { name: 'is_deleted', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'issue_categories',
      columns: [
        { name: 'legacy_id', type: 'number', isOptional: true },
        { name: 'name', type: 'string' },
        { name: 'label', type: 'string', isOptional: true },
        { name: 'abbreviation', type: 'string', isOptional: true },
        { name: 'confidentiality_level', type: 'string', isOptional: true },
        { name: 'redirection_protocol', type: 'number', isOptional: true },
        { name: 'assigned_department', type: 'string', isOptional: true }, // JSON stringifié
        // Ajoutés en v2 : présents côté backend (issue/models.py::IssueCategory,
        // sync/serializers.py::IssueCategorySerializer, fields = '__all__') depuis l'origine mais
        // absents du schéma initial — WatermelonDB ignorait silencieusement ces deux colonnes au
        // pull faute de colonne locale correspondante.
        { name: 'assigned_appeal_department', type: 'string', isOptional: true }, // JSON stringifié
        { name: 'assigned_escalation_department', type: 'string', isOptional: true }, // JSON stringifié
        { name: 'administrative_level', type: 'string', isOptional: true },
        { name: 'is_deleted', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'issue_age_groups',
      columns: [
        { name: 'legacy_id', type: 'number', isOptional: true },
        { name: 'name', type: 'string' },
        { name: 'is_deleted', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Référentiels découverts hors du plan initial CLAUDE.md (CitizenReportContactInfo.js) —
    // même patron que issue_age_groups.
    tableSchema({
      name: 'issue_citizen_groups_1',
      columns: [
        { name: 'legacy_id', type: 'number', isOptional: true },
        { name: 'name', type: 'string' },
        { name: 'is_deleted', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'issue_citizen_groups_2',
      columns: [
        { name: 'legacy_id', type: 'number', isOptional: true },
        { name: 'name', type: 'string' },
        { name: 'is_deleted', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'issue_types',
      columns: [
        { name: 'legacy_id', type: 'number', isOptional: true },
        { name: 'name', type: 'string' },
        { name: 'is_deleted', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'issue_departments',
      columns: [
        { name: 'legacy_id', type: 'number', isOptional: true },
        { name: 'name', type: 'string' },
        { name: 'head_name', type: 'string', isOptional: true },
        { name: 'is_deleted', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Cache local des niveaux administratifs (village/canton/préfecture/région), alimenté par
    // syncAdministrativeLevels() — endpoint séparé du protocole pull/push habituel car la base
    // `mis` (MySQL, externe) n'a pas de suivi `updated_at` fiable pour un sync incrémental
    // (CLAUDE.md §2.1/§4.7).
    tableSchema({
      name: 'administrative_regions',
      columns: [
        { name: 'server_id', type: 'number', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'type', type: 'string', isOptional: true },
        { name: 'parent_id', type: 'number', isOptional: true },
        { name: 'latitude', type: 'number', isOptional: true },
        { name: 'longitude', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'adls',
      columns: [
        { name: 'legacy_couch_id', type: 'string', isOptional: true },
        { name: 'name', type: 'string' },
        { name: 'location_name', type: 'string', isOptional: true },
        { name: 'representative', type: 'number', isOptional: true }, // authentication.User (pk entier)
        { name: 'representative_name', type: 'string', isOptional: true },
        { name: 'department', type: 'string', isOptional: true },
        { name: 'administrative_region_ids', type: 'string', isOptional: true }, // JSON array
        { name: 'additional_administrative_region_ids', type: 'string', isOptional: true },
        { name: 'is_deleted', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // ---- Domaine "budget participatif" (grm-backend/src/budgeting) : personnel à un
    // facilitateur, filtré par propriétaire côté serveur (sync/views.py::SYNC_OWNED_MODELS),
    // jamais partagé entre utilisateurs. Ex CouchDB `eadl.phases[]`/`eadl.bp_projects[]`. ----
    tableSchema({
      name: 'phases',
      columns: [
        { name: 'adl', type: 'string', isIndexed: true },
        { name: 'ordinal', type: 'number' },
        { name: 'title', type: 'string' },
        { name: 'open_at', type: 'number', isOptional: true },
        { name: 'due_at', type: 'number', isOptional: true },
        { name: 'closed_at', type: 'number', isOptional: true },
        { name: 'is_deleted', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'tasks',
      columns: [
        { name: 'phase', type: 'string', isIndexed: true },
        { name: 'ordinal', type: 'number' },
        // 'multiple_list_activity' | 'vote_activity' | 'input_activity' | 'document'
        { name: 'task_type', type: 'string' },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        // 'not-started' | 'in-progress' | 'completed'
        { name: 'status', type: 'string' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'open_at', type: 'number', isOptional: true },
        { name: 'due_at', type: 'number', isOptional: true },
        { name: 'closed_at', type: 'number', isOptional: true },
        { name: 'location', type: 'string', isOptional: true }, // JSON {lat,lng}
        { name: 'bp_amount', type: 'number', isOptional: true }, // uniquement task_type='input_activity'
        { name: 'is_deleted', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'bp_projects',
      columns: [
        { name: 'adl', type: 'string', isIndexed: true },
        { name: 'external_code', type: 'string', isOptional: true }, // ex `${commune}-${n}`
        { name: 'district_name', type: 'string', isOptional: true },
        { name: 'subproject_name', type: 'string', isOptional: true },
        { name: 'subproject_description', type: 'string', isOptional: true },
        { name: 'vote_ym', type: 'number' },
        { name: 'vote_yf', type: 'number' },
        { name: 'vote_mm', type: 'number' },
        { name: 'vote_mf', type: 'number' },
        { name: 'vote_om', type: 'number' },
        { name: 'vote_of', type: 'number' },
        { name: 'is_deleted', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'budget_allocations',
      columns: [
        { name: 'bp_project', type: 'string', isIndexed: true },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'amount', type: 'number' },
        { name: 'entry_date', type: 'number' },
        { name: 'is_deleted', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});

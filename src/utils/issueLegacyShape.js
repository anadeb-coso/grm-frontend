import { database } from '../database';

/**
 * Convertit un enregistrement WatermelonDB `Issue` vers la forme de document CouchDB legacy
 * attendue par les écrans historiques (IssueSearch, WorkInProgress, IssueActions, IssueDetail...)
 * — `status.id`/`category.id`/`reporter.id`/`assignee.id` redeviennent des identifiants
 * numériques `legacy_id` (cf. issue/models.py), évitant de réécrire toute la logique de ces
 * écrans qui compare ces ids à des constantes littérales (1 = "Enregistrée", 3 = "Résolue"...).
 *
 * `record` porte une référence vers le vrai enregistrement WatermelonDB, utilisée par les écrans
 * de mutation (IssueActions, IssueDetail) pour appeler `.update()`/`database.write()` dessus —
 * les tableaux imbriqués `comments`/`reasons`/`issue_status_stories`/`escalation_*` du document
 * CouchDB legacy n'existent plus : ce sont des tables enfants WatermelonDB séparées, chargées à
 * la demande via `record.comments.fetch()` etc.
 */
export async function toLegacyIssueShape(issue) {
  const [status, category, ageGroup, issueType] = await Promise.all([
    issue.status.fetch(),
    issue.category.fetch(),
    issue.ageGroup ? issue.ageGroup.fetch() : Promise.resolve(null),
    issue.issueType.fetch(),
  ]);

  return {
    record: issue,
    _id: issue.id,
    id: issue.autoIncrementId,
    internal_code: issue.internalCode,
    tracking_code: issue.trackingCode,
    description: issue.description,
    confirmed: issue.confirmed,
    publish: issue.publish,
    citizen: issue.citizen,
    contact_medium: issue.contactMedium,
    citizen_type: issue.citizenType,
    citizen_group_1: issue.citizenGroup1,
    citizen_group_2: issue.citizenGroup2,
    citizen_or_group: issue.citizenOrGroup,
    created_date: issue.createdDate,
    intake_date: issue.intakeDate,
    issue_date: issue.issueDate,
    resolution_date: issue.resolutionDate,
    reject_date: issue.rejectDate,
    research_result: issue.researchResult,
    escalate_flag: issue.escalateFlag,
    location_info: issue.locationInfo,
    structure_in_charge: issue.structureInCharge,
    contact_information: issue.contactInformation,
    commune: issue.commune,
    status: status ? { id: status.legacyId, name: status.name, final_status: status.finalStatus, initial_status: status.initialStatus, rejected_status: status.rejectedStatus, open_status: status.openStatus, unresolved_status: status.unresolvedStatus, eligible_status: status.eligibleStatus, not_eligible_status: status.notEligibleStatus } : null,
    category: category ? { id: category.legacyId, name: category.name, abbreviation: category.abbreviation, confidentiality_level: category.confidentialityLevel, administrative_level: category.administrativeLevel, assigned_department: category.assignedDepartment } : null,
    citizen_age_group: ageGroup ? { id: ageGroup.legacyId, name: ageGroup.name } : null,
    issue_type: issueType ? { id: issueType.legacyId, name: issueType.name } : null,
    reporter: issue.reporterId ? { id: issue.reporterId, name: issue.reporterName } : null,
    assignee: issue.assigneeId ? { id: issue.assigneeId, name: issue.assigneeName } : null,
    administrative_region: {
      administrative_id: issue.administrativeRegionId,
      name: issue.administrativeRegionName,
    },
  };
}

export async function toLegacyIssueShapes(issues) {
  return Promise.all(issues.map(toLegacyIssueShape));
}

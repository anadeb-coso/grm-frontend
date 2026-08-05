import NetInfo from '@react-native-community/netinfo';
import { Q } from '@nozbe/watermelondb';
import API from "../services/API";
import { database } from '../database';
import { runSyncSafely } from '../database/watermelonSyncManager';

// Convertit un enregistrement WatermelonDB `Issue` en forme de document legacy attendue par
// l'endpoint Django existant `/issue/save-issue-datas/` (API.sync_datas), qui lit encore
// `issue.reporter.id`/`issue.assignee.id` — voir CitizenReportStep3/containers/Content.js pour
// le même patron utilisé ailleurs.
async function toLegacyIssuePayload(issue) {
  return {
    _id: issue.id,
    internal_code: issue.internalCode,
    tracking_code: issue.trackingCode,
    description: issue.description,
    confirmed: issue.confirmed,
    reporter: issue.reporterId ? { id: issue.reporterId, name: issue.reporterName } : null,
    assignee: issue.assigneeId ? { id: issue.assigneeId, name: issue.assigneeName } : null,
  };
}

export function check_issues(dbConfig, eadl, language='fr') {

    try {

        if (!eadl || !eadl?.representative || !eadl?.representative?.email) return;

        NetInfo.fetch().then(async (state) => {
            if (state.isConnected) {
                try {
                    const issueRecords = await database.get('issues').query(Q.where('confirmed', true)).fetch();
                    const relevant = issueRecords.filter(
                        (i) => i.reporterId === eadl.representative.id || i.assigneeId === eadl.representative.id
                    );
                    const issues = await Promise.all(relevant.map(toLegacyIssuePayload));

                    new API()
                        .sync_datas({ issues: issues, email: eadl.representative.email }, language)
                        .then(response => {
                            // console.log(response.status != 'ok');
                            if (response.status != 'ok') {
                                //
                            } else {
                                //
                            }
                        })
                        .catch(error => {
                            console.log("Error1 : " + error);
                        });
                } catch (e) {
                    console.log("Error3 : " + e);
                }

                // Déclenche la synchronisation WatermelonDB (remplace SyncToRemoteDatabase/PouchDB).
                await runSyncSafely();

            }
        });
    } catch (e) {
        console.log("Error4 : " + e);
    }
}





export function check_only_issues_saved(eadl) {

    if (!eadl || !eadl?.representative || !eadl?.representative?.email) return;

    NetInfo.fetch().then((state) => {
        if (state.isConnected) {
            try {
                new API()
                    .check_sync_issues({ email: eadl.representative.email })
                    .then(response => {
                        // console.log(response.status != 'ok');
                        if (response.status != 'ok') {
                            //
                        } else {
                            //
                        }
                    })
                    .catch(error => {
                        console.log("Error1 : " + error);
                    });
            } catch (e) {
                console.log("Error3 : " + e);
            }
        }
    });

}

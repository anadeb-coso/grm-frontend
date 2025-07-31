import NetInfo from '@react-native-community/netinfo';
import API from "../services/API";
import { LocalGRMDatabase } from './databaseManager';





export function check_issues(eadl, language='fr') {

    try {

        if (!eadl || !eadl?.representative || !eadl?.representative?.email) return;

        NetInfo.fetch().then((state) => {
            if (state.isConnected) {
                try {
                    LocalGRMDatabase.find({
                        selector: {
                            type: 'issue',
                            confirmed: true,
                            "$or": [
                                {
                                    "reporter.id": eadl.representative.id
                                },
                                {
                                    "assignee.id": eadl.representative.id
                                }
                            ]
                        },
                    })
                        .then((result) => {
                            let issues = result?.docs ?? [];
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

                        })
                        .catch((err) => {
                            console.log("Error2 : " + err);
                        });
                } catch (e) {
                    console.log("Error3 : " + e);
                }
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



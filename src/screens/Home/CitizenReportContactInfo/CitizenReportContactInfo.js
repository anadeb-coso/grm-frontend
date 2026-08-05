import React, {useEffect, useState} from "react";
import { SafeAreaView } from "react-native";
import Content from "./containers/Content";
import { styles } from "./CitizenReportContactInfo.styles";
import { database } from "../../../database";

const CitizenReportContactInfo = ({ route }) => {
  const customStyles = styles();
  const { params } = route;
  const [issueAges, setIssueAges] = useState();
  const [citizenGroupsI, setCitizenGroupsI] = useState();
  const [citizenGroupsII, setCitizenGroupsII] = useState();


  useEffect(() => {
    //FETCH ISSUE AGE GROUP
    database.get('issue_age_groups').query().fetch()
        .then(function (records) {
          setIssueAges(records.map((r) => ({ id: r.legacyId, name: r.name })));
        })
        .catch(function (err) {
          console.log(err);
        });
    //FETCH CITIZEN GROUP 1
    database.get('issue_citizen_groups_1').query().fetch()
        .then(function (records) {
          setCitizenGroupsI(records.map((r) => ({ id: r.legacyId, name: r.name })));
        })
        .catch(function (err) {
          console.log(err);
        });
    //FETCH CITIZEN GROUP 2
    database.get('issue_citizen_groups_2').query().fetch()
        .then(function (records) {
          setCitizenGroupsII(records.map((r) => ({ id: r.legacyId, name: r.name })));
        })
        .catch(function (err) {
          console.log(err);
        });
  }, []);

  return (
    <SafeAreaView style={customStyles.container}>
      <Content
          stepOneParams={params.stepOneParams}
          issueAges={issueAges}
          citizenGroupsII={citizenGroupsII}
          citizenGroupsI={citizenGroupsI}
      />
    </SafeAreaView>
  );
};

export default CitizenReportContactInfo;

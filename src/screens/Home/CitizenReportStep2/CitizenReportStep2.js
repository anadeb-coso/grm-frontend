import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native";
import Content from "./containers/Content";
import { styles } from "./CitizenReportStep2.styles";
import { database } from "../../../database";

const CitizenReportStep2 = ({ route }) => {
  const { params } = route;
  const [issueCategories, setIssueCategories] = useState();
  const [issueTypes, setIssueTypes] = useState();

  useEffect(() => {
    //FETCH ISSUE CATEGORY
    database.get('issue_categories').query().fetch()
      .then(function (records) {
        setIssueCategories(
          records
            .map((c) => ({
              id: c.legacyId,
              name: c.name,
              label: c.label,
              abbreviation: c.abbreviation,
              confidentiality_level: c.confidentialityLevel,
              assigned_department: c.assignedDepartment,
            }))
            .filter((obj) => !([4, 7].includes(obj.id)))
        );
      })
      .catch(function (err) {
        console.log(err);
      });

    //FETCH ISSUE TYPE
    database.get('issue_types').query().fetch()
      .then(function (records) {
        setIssueTypes(records.map((t) => ({ id: t.legacyId, name: t.name })));
      })
      .catch(function (err) {
        console.log(err);
      });
  }, []);

  const customStyles = styles();
  return (
    <SafeAreaView style={customStyles.container}>
      <Content
        stepOneParams={params.stepOneParams}
        issueCategories={issueCategories}
        issueTypes={issueTypes}
      />
    </SafeAreaView>
  );
};

export default CitizenReportStep2;

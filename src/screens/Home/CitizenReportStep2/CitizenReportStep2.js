import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native";
import Content from "./containers/Content";
import { styles } from "./CitizenReportStep2.styles";
import { LocalGRMDatabase } from "../../../utils/databaseManager";

const CitizenReportStep2 = ({ route }) => {
  const { params } = route;
  const [issueCategories, setIssueCategories] = useState();
  const [issueTypes, setIssueTypes] = useState();

  useEffect(() => {
    //FETCH ISSUE CATEGORY
    LocalGRMDatabase.find({
      selector: { type: "issue_category" },
    })
      .then(function (result) {
        setIssueCategories(result?.docs);
      })
      .catch(function (err) {
        console.log(err);
      });

    //FETCH ISSUE TYPE
    LocalGRMDatabase.find({
      selector: { type: "issue_type" },
    })
      .then(function (result) {
        setIssueTypes(result?.docs);
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

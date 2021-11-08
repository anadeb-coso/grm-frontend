import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native";
import Content from "./containers/Content";
import { styles } from "./CitizenReportLocationStep.styles";
import { LocalCommunesDatabase } from "../../../utils/databaseManager";

const CitizenReportLocationStep = ({ route }) => {
  const { params } = route;
  const [issueCommunes, setIssueCommunes] = useState();

  useEffect(() => {
    //FETCH ISSUE CATEGORY
    LocalCommunesDatabase.find({
      selector: { type: "administrative_level" },
    })
      .then(function (result) {
        setIssueCommunes(result?.docs);
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
        stepTwoParams={params.stepTwoParams}
        issueCommunes={issueCommunes}
      />
    </SafeAreaView>
  );
};

export default CitizenReportLocationStep;

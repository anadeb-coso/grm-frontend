import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native";
import Content from "./containers/Content";
import { styles } from "./CitizenReportStep3.styles";
import { useSelector } from "react-redux";
import LocalDatabase from "../../../utils/databaseManager";

const CitizenReportStep3 = ({ route }) => {
  const { params } = route;
  const customStyles = styles();
  const [eadl, setEadl] = useState(false);
  const { username } = useSelector((state) => {
    return state.get("authentication").toObject();
  });

  useEffect(() => {
    if (username) {
      LocalDatabase.find({
        selector: { "representative.email": username },
        // fields: ["_id", "commune", "phases"],
      })
        .then(function (result) {
          setEadl(result.docs[0]);

          // handle result
        })
        .catch(function (err) {
          console.log(err);
        });
    }
  }, [username]);
  return (
    <SafeAreaView style={customStyles.container}>
      <Content
        eadl={eadl}
        issue={{
          ...params.stepOneParams,
          ...params.stepTwoParams,
          ...params.stepLocationParams,
        }}
      />
    </SafeAreaView>
  );
};

export default CitizenReportStep3;

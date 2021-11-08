import React, { useEffect, useState } from "react";
import { SafeAreaView, ActivityIndicator } from "react-native";
import Content from "./containers/Content";
import { styles } from "./ParticipatoryBudgetingList.styles";
import LocalDatabase from "../../../utils/databaseManager";
import { useSelector } from "react-redux";
import { colors } from "../../../utils/colors";

const ParticipatoryBudgetingList = () => {
  const customStyles = styles();
  const [loading, setLoading] = useState(true);
  const [eadl, setEadl] = useState();
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
          setLoading(false);
          setEadl(result.docs[0]);

          // handle result
        })
        .catch(function (err) {
          setLoading(false);
          console.log(err);
        });
    }
  }, [username]);
  // console.log(phases);
  return (
    <SafeAreaView style={customStyles.container}>
      {loading ? (
        <ActivityIndicator
          style={{ marginTop: 50 }}
          color={colors.primary}
          size={"large"}
        />
      ) : (
        <Content eadl={eadl} />
      )}
    </SafeAreaView>
  );
};
export default ParticipatoryBudgetingList;

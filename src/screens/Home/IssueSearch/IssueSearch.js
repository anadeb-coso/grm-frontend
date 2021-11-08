import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native";
import Content from "./containers";
import { styles } from "./IssueSearch.style";
import LocalDatabase, {
  LocalGRMDatabase,
} from "../../../utils/databaseManager";
import { useSelector } from "react-redux";

const IssueSearch = () => {
  const customStyles = styles();
  const [issues, setIssues] = useState([]);
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

  useEffect(() => {
    //FETCH ISSUE CATEGORY
    if (eadl) {
      LocalGRMDatabase.find({
        selector: {
          type: "issue",
          "reporter.name": eadl.representative.name,
        },
      })
        .then(function (result) {
          setIssues(result?.docs);
        })
        .catch(function (err) {
          console.log(err);
        });
    }
  }, [eadl]);

  return (
    <SafeAreaView style={customStyles.container}>
      <Content issues={issues} eadl={eadl} />
    </SafeAreaView>
  );
};

export default IssueSearch;

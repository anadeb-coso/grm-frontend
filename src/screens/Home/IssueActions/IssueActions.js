import React, {useEffect, useState} from "react";
import { SafeAreaView } from "react-native";
import Content from "./containers/Content";
import { styles } from "./IssueActions.styles";
import {LocalGRMDatabase} from "../../../utils/databaseManager";

const IssueActions = ({ route, navigation }) => {
    const { params } = route;
    const [statuses, setStatuses] = useState()
    const customStyles = styles();

    useEffect(()=>{
        LocalGRMDatabase.find({
            selector: { type: "issue_status" },
        })
            .then(function (result) {
                setStatuses(result.docs)
            })
            .catch(function (err) {
                alert('Unable to retrieve statuses. ' + JSON.stringify(err));
            });
    }, []);

  return (
    <SafeAreaView style={customStyles.container}>
      <Content issue={params.item} navigation={navigation} statuses={statuses} />
    </SafeAreaView>
  );
};

export default IssueActions;

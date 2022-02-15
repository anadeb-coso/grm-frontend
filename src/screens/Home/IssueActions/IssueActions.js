import React, {useEffect} from "react";
import { SafeAreaView } from "react-native";
import Content from "./containers/Content";
import { styles } from "./IssueActions.styles";
import {LocalGRMDatabase} from "../../../utils/databaseManager";

const IssueActions = ({ route, navigation }) => {
    const { params } = route;
    const customStyles = styles();

    useEffect(()=>{
        LocalGRMDatabase.find({
            selector: { type: "issue_status" },
        })
            .then(function (result) {
                console.log(result)
            })
            .catch(function (err) {
                console.log(err);
            });
    }, []);

  return (
    <SafeAreaView style={customStyles.container}>
      <Content issue={params.item} navigation={navigation} />
    </SafeAreaView>
  );
};

export default IssueActions;

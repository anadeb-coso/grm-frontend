import React from "react";
import { SafeAreaView } from "react-native";
import Content from "./containers/Content";
import { styles } from "./IssueHistory.styles";

const IssueHistory = ({ route }) => {
    const { params } = route;
    const customStyles = styles();

    return (
        <SafeAreaView style={customStyles.container}>
            <Content issue={params.item} />
        </SafeAreaView>
    );
};

export default IssueHistory;

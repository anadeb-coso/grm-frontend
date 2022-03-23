import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator } from 'react-native-paper';
import Content from './containers/Content';
import { styles } from './IssueHistory.styles';

function IssueHistory({ route }) {
  const { params } = route;
  const customStyles = styles();
  const [issue, setIssue] = useState();

  useFocusEffect(
    React.useCallback(() => {
      setIssue({ ...params.item });
      return () => {};
    }, [params])
  );

  if (!issue)
    return <ActivityIndicator style={{ paddingTop: '40%' }} size="small" color="#24c38b" />;
  return (
    <SafeAreaView style={customStyles.container}>
      <Content issue={issue} />
    </SafeAreaView>
  );
}

export default IssueHistory;

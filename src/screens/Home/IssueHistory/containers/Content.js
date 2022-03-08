import React, { useState, useEffect } from 'react';
import { View, Text, FlatList } from 'react-native';
import { Divider } from 'react-native-paper';
import moment from 'moment';
import { useFocusEffect } from '@react-navigation/native';
import { styles } from './Content.styles';

function Content({ issue }) {
  const [comments, setComments] = useState();
  const loadComments = () => {
    const invertedComments = [...issue.comments];
    setComments(invertedComments?.reverse());
  };
  const renderItem = ({ item, index }) => (
    <View key={index} style={styles.commentCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
        <View style={styles.greenCircle} />
        <View>
          <Text style={styles.radioLabel}>{item.name}</Text>
          <Text style={styles.radioLabel}>{moment(item.due_at).format('DD-MMM-YYYY')}</Text>
        </View>
      </View>
      <Text style={styles.stepNote}>{item.comment}</Text>
    </View>
  );

  const listHeader = () => <Text style={styles.title}>Activity</Text>;

  useEffect(() => {
    if (issue) {
      loadComments();
    }
  }, [issue]);

  const dividerItem = () => <Divider />;
  return (
    <View style={styles.container}>
      {comments?.length > 0 && (
        <FlatList
          ItemSeparatorComponent={dividerItem}
          ListHeaderComponent={listHeader}
          data={comments}
          renderItem={renderItem}
          keyExtractor={(item) => item.due_at}
        />
      )}
    </View>
  );
}

export default Content;

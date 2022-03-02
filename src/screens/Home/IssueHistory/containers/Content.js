import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList
} from "react-native";
import { styles } from "./Content.styles";
import { Card } from "react-native-paper";
import { colors } from "../../../../utils/colors";
import moment from "moment";

const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: "white",
    placeholder: "#dedede",
    text: "#707070",
  },
};

function Content({ issue }) {
  const [comments, setComments] = useState();
  const loadComments = () => {
    setComments(issue.comments)
  }
  const renderItem = ({item, index}) => {
    return (

        <View key={index} style={styles.commentCard}>
          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 5}}>
            <View style={styles.greenCircle} />
            <View>
              <Text style={styles.radioLabel}>{item.name}</Text>
              <Text style={styles.radioLabel}>{moment(item.due_at).format('DD-MMM-YYYY')}</Text>
            </View>
          </View>
          <Text style={styles.stepNote}>{item.comment}</Text>
        </View>
    )
  }

  const listHeader = () => <Text style={styles.title}>Activity</Text>

  useEffect(() => {
    if(issue){
      loadComments();
    }
  }, [issue])

  return (
      <View style={styles.container}>
        {comments && <FlatList ListHeaderComponent={listHeader} data={comments} renderItem={renderItem} keyExtractor={(item) => item.due_at}/>}
      </View>
  );
}

export default Content;

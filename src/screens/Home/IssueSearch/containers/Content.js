import React, { useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, Text, StatusBar, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ToggleButton } from 'react-native-paper';
import { colors } from '../../../../utils/colors';
import i18n from 'i18n-js';
import ListHeader from '../components/ListHeader';

function Content({ issues, eadl, statuses }) {
  const navigation = useNavigation();
  const [selectedId, setSelectedId] = useState(null);
  const [status, setStatus] = useState('assigned');
  const [_issues, setIssues] = useState([]);

  useEffect(() => {
    setIssues(issues);
  }, []);

  useEffect(() => {
    let filteredIssues;
    let foundStatus;
    switch (status) {
      case 'assigned':
        filteredIssues = issues.filter((issue) => issue.assignee && issue.assignee.id === eadl._id);
        break;
      case 'open':
        foundStatus = statuses.find((el) => el.final_status === false);
        foundStatus = statuses.find((el) => el.final_status === false);
        filteredIssues = issues.filter(
          (issue) =>
            ((issue.assignee && issue.assignee.id === eadl._id) ||
              (issue.reporter && issue.reporter.id === eadl._id)) &&
            issue.status.id === foundStatus.id
        );
        break;
      case 'resolved':
        foundStatus = statuses.find((el) => el.final_status === true);
        filteredIssues = issues.filter(
          (issue) =>
            ((issue.assignee && issue.assignee.id === eadl._id) ||
              (issue.reporter && issue.reporter.id === eadl._id)) &&
            issue.status.id === foundStatus.id
        );
        break;
      default:
        filteredIssues = _issues.map((issue) => issue);
    }
    setIssues(filteredIssues);
  }, [status]);

  function Item({ item, onPress, backgroundColor, textColor }) {
    return (
      <TouchableOpacity onPress={onPress} style={[styles.item]}>
        <Text style={[styles.title, { flexShrink: 1 }]}>{item.category?.name?.length > 40 ? `${item.category.name.substring(0, 40)}...` : item.category?.name}</Text>
        <Text style={[styles.subTitle, { flexShrink: 1 }]}>{item.description?.length > 40 ? `${item.description.substring(0, 40)}...` : item.description}</Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text style={[styles.subTitle]}>Code: {item.tracking_code}</Text>
          <MaterialCommunityIcons name="chevron-right-circle" size={24} color={colors.primary} />
        </View>
        {/* <Text style={[styles.title]}>{item.description}</Text> */}
      </TouchableOpacity>
    );
  }

  const renderItem = ({ item }) => {
    console.log(item)
    const backgroundColor = item.id === selectedId ? '#6e3b6e' : '#f9c2ff';
    const color = item.id === selectedId ? 'white' : 'black';

    return (
      <Item
        item={item}
        onPress={() =>
          navigation.navigate('IssueDetailTabs', {
            item,
            merge: true,
          })
        }
        backgroundColor={{ backgroundColor }}
        textColor={{ color }}
      />
    );
  };

  const renderHeader = () => (
    <ListHeader overdue={issues.overdue} length={issues.length} average={issues.average} />
  );
  return (
    <>
      <ToggleButton.Row
        style={{ justifyContent: 'space-between' }}
        onValueChange={(value) => setStatus(value)}
        value={status}
      >
        <ToggleButton
          style={{ flex: 1 }}
          icon={() => (
            <View>
              <Text style={{ color: colors.primary }}>{i18n.t('assigned')}</Text>
            </View>
          )}
          value="assigned"
        />
        <ToggleButton
          style={{ flex: 1 }}
          icon={() => (
            <View>
              <Text style={{ color: colors.primary }}>{i18n.t('open')}</Text>
            </View>
          )}
          value="open"
        />
        <ToggleButton
          style={{ flex: 1 }}
          icon={() => (
            <View>
              <Text style={{ color: colors.primary }}>{i18n.t('resolved')}</Text>
            </View>
          )}
          value="resolved"
        />
      </ToggleButton.Row>
      <FlatList
        style={{ flex: 1 }}
        data={_issues}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        keyExtractor={(item) => item._id}
        extraData={selectedId}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: StatusBar.currentHeight || 0,
  },
  item: {
    flex: 1,
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 23,
    borderBottomWidth: 1,
    borderColor: '#f6f6f6',
  },
  title: {
    fontFamily: 'Poppins_500Medium',
    // fontSize: 12,
    fontWeight: 'normal',
    fontStyle: 'normal',
    // lineHeight: 10,
    letterSpacing: 0,
    // textAlign: "left",
    color: '#707070',
  },
  subTitle: {
    fontFamily: 'Poppins_300Light',
    fontSize: 12,
    fontWeight: 'normal',
    fontStyle: 'normal',
    // lineHeight: 10,
    letterSpacing: 0,
    // textAlign: "left",
    color: '#707070',
  },
  statisticsText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    fontWeight: 'bold',
    fontStyle: 'normal',
    letterSpacing: 0,
    textAlign: 'left',
    color: '#707070',
  },
});

export default Content;

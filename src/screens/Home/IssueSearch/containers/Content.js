import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ToggleButton } from 'react-native-paper';
import { colors } from '../../../../utils/colors';
import ListHeader from '../components/ListHeader';

function Content({ issues, eadl, statuses }) {
  const { t } = useTranslation();

  const navigation = useNavigation();
  const [selectedId, setSelectedId] = useState(null);
  const [status, setStatus] = useState('assigned');
  const [_issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState({});

  useEffect(() => {
    setIssues(issues);
  }, []);
 
  useEffect(() => {
    const filteredIssuesCopy = { ...issues };

    filteredIssuesCopy.registe = issues.filter(
      (issue) => (issue.reporter && issue.reporter.id === eadl.representative?.id)
    );

    filteredIssuesCopy.assigned = issues.filter(
      (issue) => issue.assignee && issue.assignee.id === eadl.representative?.id
    );

    // const openStatus = statuses.find((el) => el.open_status === true);
    // filteredIssuesCopy.open = issues.filter(
    //   (issue) =>
    //     ((issue.assignee && issue.assignee.id === eadl.representative?.id) ||
    //       (issue.reporter && issue.reporter.id === eadl.representative?.id)) &&
    //     issue.status.id === openStatus.id
    // );
    filteredIssuesCopy.open = issues.filter(
      (issue) => (issue.reporter && issue.reporter.id === eadl.representative?.id) && issue.status.id === 2
    );

    // const resolvedStatus = statuses.find((el) => el.final_status === true);
    // filteredIssuesCopy.resolved = issues.filter(
    //   (issue) =>
    //     ((issue.assignee && issue.assignee.id === eadl.representative?.id) ||
    //       (issue.reporter && issue.reporter.id === eadl.representative?.id)) &&
    //     issue.status.id === resolvedStatus.id
    // );
    filteredIssuesCopy.resolved = issues.filter(
      (issue) => (issue.assignee && issue.assignee.id === eadl.representative?.id) && issue.status.id === 3
    );

    filteredIssuesCopy.yourResolution = issues.filter(
      (issue) => (issue.reporter && issue.reporter.id === eadl.representative?.id) && issue.status.id === 3
    );

    filteredIssuesCopy.rejected = issues.filter(
      (issue) => (issue.assignee && issue.assignee.id === eadl.representative?.id) && issue.status.id === 4
    );

    filteredIssuesCopy.YourRejecte = issues.filter(
      (issue) => (issue.reporter && issue.reporter.id === eadl.representative?.id) && issue.status.id === 4
    );

    setFilteredIssues(filteredIssuesCopy);

    let selectedTabIssues;
    switch (status) {
      case 'registe':
        selectedTabIssues = filteredIssuesCopy.registe;
        break;
      case 'assigned':
        selectedTabIssues = filteredIssuesCopy.assigned;
        break;
      case 'open':
        selectedTabIssues = filteredIssuesCopy.open;

        break;
      case 'resolved':
        selectedTabIssues = filteredIssuesCopy.resolved;
        break;
      case 'rejected':
        selectedTabIssues = filteredIssuesCopy.rejected;
        break;
      default:
        selectedTabIssues = _issues.map((issue) => issue);
    }
    setIssues(selectedTabIssues);
  }, [status, issues, statuses, eadl.representative?.id]);

  function Item({ item, onPress, backgroundColor, textColor }) {
    return (
      <TouchableOpacity onPress={onPress} style={[styles.item]}>
        <Text style={[styles.title, { flexShrink: 1 }]}>
          {item.category?.name?.length > 40
            ? `${item.category.name.substring(0, 40)}...`
            : item.category?.name}
        </Text>
        <Text style={[styles.subTitle, { flexShrink: 1 }]}>
          {item.description?.length > 40
            ? `${item.description.substring(0, 40)}...`
            : item.description}
        </Text>
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

  // console.log({ _issues, eadl });

  const renderHeader = () => (
    <ListHeader
      overdue={issues.overdue}
      length={issues.length}
      average={issues.average}
      resolved={filteredIssues?.resolved?.length || 0}

      registe={filteredIssues?.registe?.length || 0}
      assigned={filteredIssues?.assigned?.length || 0}
      open={filteredIssues?.open?.length || 0}
      yourResolution={filteredIssues?.yourResolution?.length || 0}
      rejected={filteredIssues?.rejected?.length || 0}
      YourRejecte={filteredIssues?.YourRejecte?.length || 0}
    />
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
              <Text style={{ color: colors.primary }}>{t('initial_status')}</Text>
            </View>
          )}
          value="registe"
        />
        <ToggleButton
          style={{ flex: 1 }}
          icon={() => (
            <View>
              <Text style={{ color: colors.primary }}>{t('assigned')}</Text>
            </View>
          )}
          value="assigned"
        />
        <ToggleButton
          style={{ flex: 1 }}
          icon={() => (
            <View>
              <Text style={{ color: colors.primary }}>{t('open')}</Text>
            </View>
          )}
          value="open"
        />
        <ToggleButton
          style={{ flex: 1 }}
          icon={() => (
            <View>
              <Text style={{ color: colors.primary }}>{t('resolved')}</Text>
            </View>
          )}
          value="resolved"
        />
        
        <ToggleButton
          style={{ flex: 1 }}
          icon={() => (
            <View>
              <Text style={{ color: colors.primary }}>{t('rejected_status')}</Text>
            </View>
          )}
          value="rejected"
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

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ToggleButton } from 'react-native-paper';
import { colors } from '../../../../utils/colors';
import ListHeader from '../components/ListHeader';
import SearchBar from "../../../../components/Search/SearchBar";
import CustomDropDownPickerWithRender from '../../../../components/CustomDropDownPicker/CustomDropDownPickerWithRender';

function Content({ issues, eadl, statuses, issueCategories }) {
  const { t } = useTranslation();

  const navigation = useNavigation();
  const [selectedId, setSelectedId] = useState(null);
  const [status, setStatus] = useState('assigned');
  const [_issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState({});
  const [__issues, set_Issues] = useState([]);
  
  const [pickerValue2, setPickerValue2] = useState(null);
  const [items2, setItems2] = useState(issueCategories ?? []);

  useEffect(() => {
    setIssues(issues);
  }, []);
 
  useEffect(() => {
    const filteredIssuesCopy = { ...issues };

    filteredIssuesCopy.registe = issues.filter(
      (issue) => ( 
        //issue?.status?.id === 1 && 
        ((issue.reporter && issue.reporter.id === eadl.representative?.id) || eadl.administrative_region == "1")
        )
    );

    filteredIssuesCopy.assigned = issues.filter(
      (issue) => ( issue.assignee && issue.assignee.id && 
        ((issue.assignee.id === eadl.representative?.id))
        )
    );//  || eadl.administrative_region == "1"

    // const openStatus = statuses.find((el) => el.open_status === true);
    // filteredIssuesCopy.open = issues.filter(
    //   (issue) =>
    //     ((issue.assignee && issue.assignee.id === eadl.representative?.id) ||
    //       (issue.reporter && issue.reporter.id === eadl.representative?.id)) &&
    //     issue?.status?.id === openStatus.id
    // );
    filteredIssuesCopy.open = issues.filter(
      (issue) => (issue?.status?.id === 2 &&
        ((issue.reporter && issue.reporter.id === eadl.representative?.id) || eadl.administrative_region == "1")
      )
    );

    // const resolvedStatus = statuses.find((el) => el.final_status === true);
    // filteredIssuesCopy.resolved = issues.filter(
    //   (issue) =>
    //     ((issue.assignee && issue.assignee.id === eadl.representative?.id) ||
    //       (issue.reporter && issue.reporter.id === eadl.representative?.id)) &&
    //     issue?.status?.id === resolvedStatus.id
    // );
    filteredIssuesCopy.all_resolved = issues.filter(
      (issue) => (issue?.status?.id === 3 &&
        ((issue.assignee && issue.assignee.id === eadl.representative?.id) || (issue.reporter && issue.reporter.id === eadl.representative?.id) || eadl.administrative_region == "1")
      )
    );

    filteredIssuesCopy.resolved = issues.filter(
      (issue) => (issue?.status?.id === 3 &&
        ((issue.assignee && issue.assignee.id === eadl.representative?.id) || eadl.administrative_region == "1")
      )
    );

    filteredIssuesCopy.yourResolution = issues.filter(
      (issue) => (issue?.status?.id === 3 &&
        ((issue.reporter && issue.reporter.id === eadl.representative?.id) || eadl.administrative_region == "1")
      )
    );

    filteredIssuesCopy.rejected = issues.filter(
      (issue) => (issue?.status?.id === 4 &&
        ((issue.assignee && issue.assignee.id === eadl.representative?.id) || eadl.administrative_region == "1")
      )
    );

    filteredIssuesCopy.YourRejecte = issues.filter(
      (issue) => (issue?.status?.id === 4 &&
        ((issue.reporter && issue.reporter.id === eadl.representative?.id) || eadl.administrative_region == "1")
      )
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
        selectedTabIssues = filteredIssuesCopy.all_resolved;
        break;
      case 'rejected':
        selectedTabIssues = filteredIssuesCopy.rejected;
        break;
      default:
        selectedTabIssues = _issues.map((issue) => issue);
    }
    setIssues(selectedTabIssues);
    set_Issues(selectedTabIssues);
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
          {
            (item.reporter && item.reporter.id) 
            ? <Text style={[styles.subTitle]}>{t('reported_by')}: {
                item.reporter.id == eadl.representative?.id ? t('me') : item.reporter.name
              }</Text>
            : <></>
          }
          
          {/* <MaterialCommunityIcons name="chevron-right-circle" size={24} color={colors.primary} /> */}
          <MaterialCommunityIcons name="chevron-right-circle" size={24} color={
            item.status.id == 1 ? 'red' : (
              item.status.id == 2 ? 'purple' : (
                item.status.id == 3 ? 'green' : (
                  item.status.id == 5 ? 'yellow' : 'red'
                  )
                )
            )
          } />
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
      // rejected={filteredIssues?.rejected?.length || 0}
      // YourRejecte={filteredIssues?.YourRejecte?.length || 0}
      seeAllIssues={eadl.administrative_region == "1"}
    />
  );


  //Search
  const [searchPhrase, setSearchPhrase] = useState("");
  const [clicked, setClicked] = useState(false);

  const check_character = (liste, elt) => {
    let l;
    let eltUpper = elt.toUpperCase();
    for(let i=0; i<liste.length; i++){
      l = liste[i];
      if(l && eltUpper.includes(l)){
        return true;
      }
    }
    return false;
  };

  const onChangeSearchFunction = async (searchPhraseCopy = searchPhrase) => {
    let issuessSearch = [];
    if(searchPhrase && searchPhraseCopy.trim()){
      set_Issues([]);
      let _ = [..._issues];
      let elt;
      let searchPhraseSplit = [searchPhraseCopy.toUpperCase().trim()] //.split(" "); //.replace(/\s/g, "").split(" ");
      console.log(searchPhraseSplit)
      for(let i=0; i<_.length; i++){
        elt = _[i];
        if(
          (elt && elt.tracking_code && check_character(searchPhraseSplit, elt.tracking_code)) || 
          (elt && elt.internal_code && check_character(searchPhraseSplit, elt.internal_code)) || 
          (elt && elt.description && check_character(searchPhraseSplit, elt.description)) || 
          (elt && elt.category && elt.category.name && check_character(searchPhraseSplit, elt.category.name)) || 
          (elt && elt.category && elt.category.id && check_character(searchPhraseSplit, String(elt.category.id))) ||
          (elt && elt.administrative_region && elt.administrative_region.name && check_character(searchPhraseSplit, elt.administrative_region.name))
          ){
          issuessSearch.push(elt);
        }
      }
      set_Issues(issuessSearch);
    }else{
      set_Issues(_issues);
      issuessSearch = _issues;
    }
    return issuessSearch;
  };

  const onSearchIssuesByCategory = async (category) => {
    let issuessSearch = await onChangeSearchFunction();
    let _ = [...issuessSearch];
    issuessSearch = _.filter(issue => issue.category && issue.category.id === category.id);
    set_Issues(issuessSearch)
  }
  //End Search


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
        
        {/* <ToggleButton
          style={{ flex: 1 }}
          icon={() => (
            <View>
              <Text style={{ color: colors.primary }}>{t('rejected_status')}</Text>
            </View>
          )}
          value="rejected"
        /> */}
      </ToggleButton.Row>

      
      <View style={{flexDirection: 'row'}}>
      <View style={{flex: 0.8}}>
      <SearchBar
            searchPhrase={searchPhrase}
            setSearchPhrase={setSearchPhrase}
            clicked={clicked}
            setClicked={setClicked}
            onChangeFunction={(v) => {
              setPickerValue2(null);
              onChangeSearchFunction(v);
            }}
          />
      </View>
      <View style={{flex: 0.2}}>
          <CustomDropDownPickerWithRender
            schema={{
              label: 'id',
              value: 'id',
              id: 'id',
              confidentiality_level: 'confidentiality_level',
              assigned_department: 'assigned_department',
            }}
            placeholder={'Cat'}
            value={pickerValue2}
            items={issueCategories}
            setPickerValue={setPickerValue2}
            setItems={setItems2}
            onSelectItem={onSearchIssuesByCategory}
            zIndex={5}
            customDropdownWrapperStyle={{marginTop: 5, marginHorizontal: 0}}
          />
      </View>
      </View>



      <FlatList
        style={{ flex: 1 }}
        data={__issues}
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

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SafeAreaView, Text, ImageBackground, ScrollView,
  View, StyleSheet, Image, Dimensions, TouchableOpacity,
  RefreshControl
} from 'react-native';
import { Button, ActivityIndicator, List, ToggleButton } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { logout } from '../../../store/ducks/authentication.duck';
import LanguageSelector from '../../../translations/LanguageComponent';
import { setCommune, setDocument } from '../../../store/ducks/userDocument.duck';
import { Q } from '@nozbe/watermelondb';
import { colors } from '../../../utils/colors';
import { getUserDocs } from '../../../utils/databaseManager';
import { database } from '../../../database';
import { runSyncSafely } from '../../../database/watermelonSyncManager';
import ChartIssues from '../../../components/Chart/ChartIssues';
import SnackBarCheckFileUnsyncComponent from '../../../components/SnackBarCheckFileUnsyncComponent/SnackBarCheckFileUnsyncComponent';

export function WorkInProgress() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const { userDocument: eadl } = useSelector((state) => state.get('userDocument').toObject());

  const screenHeight = Dimensions.get("window").height;
  const screenWidth = Dimensions.get("window").width;
  const [refreshing, setRefreshing] = useState(false);
  const [administrative_regions_objects, setAdministrative_regions_objects] = useState(null);
  const [issues, setIssues] = useState();
  const [status, setStatus] = useState('my_statistics');

  // `eadl` (issu de getUserDocs, cf. redux userDocument) porte déjà `administrative_regions_objects`
  // — inutile de le rechercher une seconde fois via une réplication PouchDB locale désormais retirée.
  const get_adl_region_objects = () => {
    setAdministrative_regions_objects(eadl?.administrative_regions_objects ?? []);
  }
  useEffect(() => {
    const fetchUserCommune = async () => {
      if (!eadl) {
        const { userDoc, userCommune: usrC } = await getUserDocs();
        if (userDoc) {
          dispatch(setDocument(userDoc)); // Dispatch setDocument action
        }
        if (usrC) {
          dispatch(setCommune(usrC)); // Dispatch setCommune action
        }
      }
    };

    fetchUserCommune(); // Call the fetch userDocument data function

    if (eadl) {
      get_issues();
      get_adl_region_objects();
    }

  }, [dispatch, eadl]);



  const get_issues = async () => {
    setIssues([]);
    if (!(eadl && eadl.representative)) return;
    try {
      const [issueRecords, statusRecords, categoryRecords] = await Promise.all([
        database.get('issues').query(Q.where('confirmed', true)).fetch(),
        database.get('issue_statuses').query().fetch(),
        database.get('issue_categories').query().fetch(),
      ]);
      const statusesByServerId = new Map(statusRecords.map((s) => [s.id, s]));
      const categoriesByServerId = new Map(categoryRecords.map((c) => [c.id, c]));
      let docs = issueRecords.map((issue) => {
        const status = statusesByServerId.get(issue.statusId);
        const category = categoriesByServerId.get(issue.categoryId);
        return {
          reporter: issue.reporterId ? { id: issue.reporterId } : null,
          assignee: issue.assigneeId ? { id: issue.assigneeId } : null,
          status: status ? { id: status.legacyId, name: status.name } : null,
          category: category ? { id: category.legacyId, name: category.name } : null,
          publish: issue.publish,
        };
      });

      const isGlobalViewer = eadl.administrative_region == "1" && eadl.representative.groups
        && (eadl.representative.groups.includes("ViewerOfAllIssues") || eadl.representative.groups.includes("Admin"));

      if (isGlobalViewer) {
        // toutes les issues confirmées
      } else if (eadl.administrative_region == "1") {
        docs = docs.filter((issue) => issue.publish);
      } else {
        docs = docs.filter((issue) => (
          (issue.reporter && issue.reporter.id === eadl.representative.id)
          || (issue.assignee && issue.assignee.id === eadl.representative.id)
        ));
      }

      setIssues(docs);
      setRefreshing(false);
    } catch (err) {
      console.log(err);
      setRefreshing(false);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    // Récupère d'abord les dernières données du serveur avant de relire la base locale : sans ce
    // sync, "tirer pour rafraîchir" ne faisait que ré-afficher le même instantané local.
    try {
      runSyncSafely();
    } catch (err) {
      console.log(err);
    }
    //Get Issues
    await get_issues();
    //End Get Issues

    get_adl_region_objects();

  };




  if (!eadl || !administrative_regions_objects || !issues) return <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} size="small" />;
  // else console.log(eadl);


  const styles = StyleSheet.create({
    header: {
      backgroundImage: `url(${eadl.representative.photo})`,
      backgroundSize: "contain",
      height: 250
    },

    headerContent: {
      padding: 30,
      alignItems: "center",
      display: "flex",
      flex: 1,
      flexDirection: "row",
      flexWrap: "wrap"
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 63,
      borderWidth: 2,
      borderColor: "white",
      marginBottom: 10,
      float: "right"
    },
    location: {
      borderColor: "white",
      width: 10,
      height: 10,
      float: "left"
    },
    hamburger: {
      borderColor: "white",
      width: 10,
      height: 10,
      float: "right"
    },
    name: {
      fontSize: 22,
      color: "black",
      fontWeight: "600",
      fontFamily: "Poppins_400Regular"
    },
    headtText: {
      fontFamily: "Poppins_400Regular",
      color: "grey",
      fontWeight: "600",
      float: "left",
      marginLeft: 20,
      marginTop: 10
    },
    SubjectText: {
      color: "black",
      fontWeight: "550",
      fontSize: 16,
      fontFamily: "Poppins_400Regular",
      float: "left",
      marginLeft: 20,
      marginTop: 10
    },
    userInfo: {
      fontSize: 20,
      color: "white",
      fontWeight: "600"
    },
    btn: {
      marginTop: 20,
      backgroundColor: "#3B525F",
      borderRadius: 10,
      width: 200,
      height: 50,
      alignItems: "center",
      padding: "6px",
      elevation: 3
    },
    body: {
      backgroundColor: "white",
      height: 500,
      alignItems: "center"
    },
    text: {
      color: "white",
      marginHorizontal: 10,
      fontSize: 13
    },
    RectangleShapeView: {
      marginTop: 20,
      width: "80%",
      height: 80,
      backgroundColor: "white",
      color: "black",
      borderRadius: 10,
      borderColor: "black",
      borderWidth: 1,
      elevation: 3
    },
    accordionStyle: {
      backgroundColor: 'white',
      borderRadius: 10,
      marginVertical: 2,
      width: '95%',
      // marginHorizontal: 10,
      height: 50,
      elevation: 10
    },
    titleStyle: {
      fontFamily: 'Poppins_300Light',
      fontStyle: 'normal',
      fontSize: 13
    },
    descriptionStyle: {
      fontSize: 13,
    },
    subItem: {
      flex: 1,
      marginVertical: 2,
      marginLeft: 25,
      padding: 0,
      borderRadius: 25,
      borderColor: '#f6f6f6',
    },
    text_title: {
      fontSize: 16,
      // fontFamily="body"
      fontWeight: 'bold',
      color: "green",
    }
  });



  return (
    <View>
      <ScrollView
        // style={{ flex: 1, margin: 25 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ImageBackground source={require('../../../../assets/BG_1.png')}
            style={{
              width: screenWidth, height: 250,
              // marginBottom: 20 
            }}
          //imageStyle={{ borderRadius: 75 }}
          >



            <View style={styles.header}>
              <View style={styles.headerContent}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{eadl.representative.name}</Text>
                  <Text style={styles.userInfo}></Text>
                </View>
                <View>
                  <Image
                    style={styles.avatar}
                    source={![undefined, null, ""].includes(eadl.representative.photo) ? { uri: eadl.representative.photo } : require('../../../../assets/default-avatar.jpg')}
                  />
                </View>
              </View>
              <View style={{ flexDirection: 'row', marginBottom: 0, paddingBottom: 0, paddingVertical: 0, marginVertical: 0, justifyContent: 'space-between', alignItems: 'flex-start', }}>
                <View>
                  <Text style={styles.text}>{eadl.representative.email}</Text>
                  <Text style={styles.text}>{eadl.representative.phone}</Text>
                </View>
                <View >
                  <Text>{''}</Text>
                  <TouchableOpacity style={{
                    marginBottom: 11, paddingBottom: 0, paddingVertical: 0, marginVertical: 0,
                    justifyContent: 'space-between', alignItems: 'flex-start',
                  }}
                    onPress={() => navigation.navigate('ChangePasswordScreen')}
                  >
                    <Text style={{ color: 'blue', fontWeight: 'bold' }}>{t('edit_password')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

          </ImageBackground>
        </View>







        <ToggleButton.Row
          style={{ justifyContent: 'space-between' }}
          onValueChange={(value) => setStatus(value)}
          value={status}
        >
          <ToggleButton
            style={{ flex: 1 }}
            icon={() => (
              <View>
                <Text style={{ color: colors.primary }}>{t('my_statistics')}</Text>
              </View>
            )}
            value="my_statistics"
          />
          <ToggleButton
            style={{ flex: 1 }}
            icon={() => (
              <View>
                <Text style={{ color: colors.primary }}>{t('my_localities')}</Text>
              </View>
            )}
            value="my_localities"
          />
        </ToggleButton.Row>





        {status == "my_statistics" && (<>

          <View style={{ flex: 1, margin: 25 }}>
            <Text>
              <Text style={styles.text_title}>{t('number_issues_saved')} : </Text>
              <Text>{issues.filter(
                (issue) => (
                  ((issue.reporter && issue.reporter.id === eadl.representative?.id))
                )
              ).length ?? " - "}</Text>
            </Text>
            <Text>
              <Text style={styles.text_title}>{t('number_issues_in_follow_up')} : </Text>
              <Text>{issues.filter(
                (issue) => (issue.assignee && issue.assignee.id &&
                  ((issue.assignee.id === eadl.representative?.id) && issue?.status?.id === 2)
                )
              ).length + "/" + issues.filter(
                (issue) => (issue.assignee && issue.assignee.id &&
                  ((issue.assignee.id === eadl.representative?.id))
                )
              ).length}</Text>
            </Text>
            <Text>
              <Text style={styles.text_title}>{t('number_issues_tracked')} : </Text>
              <Text>{issues.filter(
                (issue) => (issue.assignee && issue.assignee.id &&
                  ((issue.assignee.id === eadl.representative?.id) && issue?.status?.id > 2)
                )
              ).length ?? " - "}</Text>
            </Text>
            <Text>
              <Text style={styles.text_title}>{t('number_issues_tracked_and_resolved')} : </Text>
              <Text>{issues.filter(
                (issue) => (issue.assignee && issue.assignee.id &&
                  ((issue.assignee.id === eadl.representative?.id) && issue?.status?.id === 3)
                )
              ).length ?? " - "}</Text>
            </Text>
          </View>

          <View style={{ flex: 1, marginHorizontal: 25 }}>
            <ChartIssues issues={issues.filter(
              (issue) => (
                ((issue.reporter && issue.reporter.id === eadl.representative?.id))
              )
            )} />
          </View>
        </>
        )}


        {status == "my_localities" && (<><View style={{ flex: 1, margin: 25 }}>
          {(eadl && eadl.administrative_region == "1") ? <>
            <Text style={{ color: "#24c38b", marginHorizontal: 0, alignSelf: 'center', }} >
              {t('operate_country')}
            </Text>
          </> : < List.AccordionGroup >
            {administrative_regions_objects.map((canton, i) => (
              <List.Accordion
                title={`${canton.name}`} id={`${i}.${i}`}
                style={{ ...styles.accordionStyle }}
                titleStyle={styles.titleStyle}
                descriptionStyle={styles.descriptionStyle}
                left={props => <List.Icon {...props} icon="folder" />}
                right={props => <List.Icon {...props} color='green' style={{ zIndex: 99, height: '150%', shadowColor: 'green' }} icon={props.isExpanded ? 'chevron-up' : 'chevron-down'} />}
              >
                {canton.villages.map((village, i_v) => <View key={`${i}.${i}.${i_v}`}
                  style={{ ...styles.accordionStyle, ...styles.subItem }}   >
                  <TouchableOpacity onPress={() => { }} key={`${i}.${i}.${i_v}.${i_v}`}>

                    <List.Item title={`${village.name}`}
                      titleStyle={styles.titleStyle}
                      descriptionStyle={styles.descriptionStyle}
                    // left={props => <List.Icon {...props} icon="chevron-right" />} 
                    />

                  </TouchableOpacity>
                </View>)}
              </List.Accordion>
            ))}
          </List.AccordionGroup>}
        </View></>)}

        <View style={{ flex: 1, margin: 25 }}>
          <LanguageSelector />
          {/* <Text>Work in Progress </Text> */}
          <Button color="#24c38b" onPress={() => dispatch(logout())}>
            {t('logout')}
          </Button>
        </View>
      </ScrollView >


      <SnackBarCheckFileUnsyncComponent />

    </View>
  );
}



export default WorkInProgress;

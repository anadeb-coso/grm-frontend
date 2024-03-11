import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SafeAreaView, Text, ImageBackground, ScrollView,
  View, StyleSheet, Image, Dimensions, TouchableOpacity,
  RefreshControl
} from 'react-native';
import { Button, ActivityIndicator, List, ToggleButton } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../../store/ducks/authentication.duck';
import LanguageSelector from '../../../translations/LanguageComponent';
import { setCommune, setDocument } from '../../../store/ducks/userDocument.duck';
import { colors } from '../../../utils/colors';
import { getUserDocs, LocalDatabase, LocalGRMDatabase } from '../../../utils/databaseManager';
import ChartIssues from '../../../components/Chart/ChartIssues';

export function WorkInProgress() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { username } = useSelector((state) => state.get('authentication').toObject());
  const { userDocument: eadl } = useSelector((state) => state.get('userDocument').toObject());

  const screenHeight = Dimensions.get("window").height;
  const screenWidth = Dimensions.get("window").width;
  const [refreshing, setRefreshing] = useState(false);
  const [administrative_regions_objects, setAdministrative_regions_objects] = useState(null);
  const [issues, setIssues] = useState();
  const [status, setStatus] = useState('my_statistics');

  const get_adl_region_objects = () => {
    LocalDatabase.find({
      selector: {
        'representative.email': eadl.representative.email
      }
    }).then((res) => {
      if (res.docs && res.docs.length > 0) {
        setAdministrative_regions_objects(res.docs[0].administrative_regions_objects);
      }else{
        setAdministrative_regions_objects([]);
      }
    }).catch((er) => {
      console.log(er);
    })
  }
  useEffect(() => {
    const fetchUserCommune = async () => {
      if (!eadl) {
        const { userDoc, userDocument: usrC } = await getUserDocs(username);
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

  }, [dispatch, eadl, username]);



  const get_issues = () => {
    setIssues([]);
    if (eadl && eadl.representative) {
      let selector = {
        type: 'issue',
        // 'reporter.id': eadl.representative.id,
        confirmed: true,
        "$or": [
          {
            "reporter.id": eadl.representative.id
          },
          {
            "assignee.id": eadl.representative.id
          }
        ]
      }
      if (eadl.administrative_region == "1" && eadl.representative.groups && (eadl.representative.groups.includes("ViewerOfAllIssues") || eadl.representative.groups.includes("Admin"))) {
        selector = {
          type: 'issue',
          confirmed: true
        }
      } else if (eadl.administrative_region == "1") {
        selector = {
          type: 'issue',
          confirmed: true,
          publish: true
        }
      }

      LocalGRMDatabase.find({
        selector: selector
      })
        .then((result) => {
          setIssues(result?.docs ?? []);
          setRefreshing(false);
        })
        .catch((err) => {
          console.log(err);
          setRefreshing(false);
        });
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    //Get Issues
    get_issues();
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
      marginHorizontal: 10
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
                  source={{ uri: eadl.representative.photo }}
                />
              </View>
            </View>
            <View>
              <Text style={styles.text}>{eadl.representative.phone}</Text>
              <Text style={styles.text}>{eadl.representative.email}</Text>
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
          <ChartIssues issues={issues} />
        </View>
      </>
      )}


      {status == "my_localities" && (<><View style={{ flex: 1, margin: 25 }}>
        < List.AccordionGroup >
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
        </List.AccordionGroup>
      </View></>)}

      <View style={{ flex: 1, margin: 25 }}>
        <LanguageSelector />
        {/* <Text>Work in Progress </Text> */}
        <Button color="#24c38b" onPress={() => dispatch(logout())}>
          {t('logout')}
        </Button>
      </View>
    </ScrollView >
  );
}



export default WorkInProgress;

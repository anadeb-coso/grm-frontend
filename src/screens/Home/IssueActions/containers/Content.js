import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { styles } from "./Content.styles";
import {Button, Dialog, Paragraph, Portal, RadioButton, TextInput} from "react-native-paper";
import { colors } from "../../../../utils/colors";
import CustomDropDownPicker from "../../../../components/CustomDropDownPicker/CustomDropDownPicker";
import i18n from "i18n-js";
import moment from "moment";
import {AntDesign, Feather} from "@expo/vector-icons";
import LocalDatabase, {LocalGRMDatabase} from "../../../../utils/databaseManager";


const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: "white",
    placeholder: "#dedede",
    text: "#707070",
  },
};

function Content({ issue, navigation, statuses = [] }) {
  const [acceptDialog, setAcceptDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [acceptedDialog, setAcceptedDialog] = useState(false);
  const [currentDate, setCurrentDate] = useState(moment());
  const [citizenName, setCitizenName] = useState();
  const [reason, onChangeReason] = React.useState('');
  const [isAcceptEnabled, setIsAcceptEnabled] = useState(false);
  const [isRecordResolutionEnabled, setIsRecordResolutionEnabled] = useState(false);
  const [isRateAppealEnabled, setIsRateAppealEnabled] = useState(false);
  const [isIssueAssignedToMe, setIsIssueAssignedToMe] = useState(false);
  const goToDetails = () => navigation.jumpTo('IssueDetail');
  const _showDialog = () => setAcceptDialog(true);
  const _showRejectDialog = () => setRejectDialog(true);

  const updateActionButtons = () =>{
    function _isAcceptEnabled(x) {
      if(x.initial_status && isIssueAssignedToMe) {
        return (issue.status?.id === x.id);
      }
    }

    function _isRecordResolutionEnabled(x) {
      if(x.open_status && isIssueAssignedToMe) {
        return issue.status?.id === x.id;
      }
    }

    function _isRateAppealEnabled(x) {
      if(x.final_status && !isIssueAssignedToMe) {
        return issue.status?.id === x.id;
      }
    }

    if(statuses){
      setIsAcceptEnabled(statuses.some(_isAcceptEnabled));
      setIsRecordResolutionEnabled(statuses.some(_isRecordResolutionEnabled));
      setIsRateAppealEnabled(statuses.some(_isRateAppealEnabled));
    }
  }
  const _hideDialog = () => setAcceptDialog(false);
  const rejectIssue= () => {
    //TODO reject issue
  }
  const acceptIssue = () => {

    const newStatus = statuses.find((x)=>
      x.open_status === true
    )

    if(!!newStatus){
      issue.status = {
        id: newStatus.id,
        name: newStatus.name
      }

      LocalGRMDatabase.upsert(issue._id, function (doc) {
        doc = issue;
        return doc;
      })
          .then(function (res) {
            updateActionButtons()
            setAcceptedDialog(true)
          })
          .catch(function (err) {
            console.log("Error", err);
            // error
          });

    }

  }


  useEffect(()=>{
    function _isIssueAssignedToMe() {
      if(issue.assignee && issue.assignee.id) {
        return issue.reporter.id === issue.assignee.id
      }
    }
    setIsIssueAssignedToMe(_isIssueAssignedToMe())

    if(issue.citizen_type !== 1){
      setCitizenName(issue.citizen)
    } else if(issue.citizen_type === 1){
      setCitizenName(_isIssueAssignedToMe() ? issue.citizen : "Anonymous")
    }

  },[])

  useEffect(()=>{
    updateActionButtons()
  },[statuses, issue])

  return (
    <ScrollView>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "position" : null}
      >
        <View style={{ padding: 23 }}>
          <Text style={styles.stepDescription}>
            {citizenName}, {issue.intake_date &&
          moment(issue.intake_date).format("DD-MMM-YYYY")}   {issue.intake_date &&
          currentDate.diff(issue.intake_date, "days")} {"days ago"}
          </Text>
          <Text style={styles.stepDescription}>Status: <Text style={{color: colors.primary}}>{issue.status?.name}</Text></Text>
          <Text style={styles.stepNote}>{issue.description?.substring(0, 170)}</Text>
          <View style={{ paddingHorizontal: 50 }}>
            <Button
                theme={theme}
                style={{ alignSelf: "center", margin: 24 }}
                labelStyle={{ color: "white", fontFamily: "Poppins_500Medium" }}
                mode="contained"
                onPress={goToDetails}
            >
              VIEW DETAILS
            </Button>
          </View>


          {/*ACTION BUTTONS*/}
          <View style={{borderWidth: 1, borderRadius: 15, padding: 15, borderColor: colors.lightgray}}>
            <TouchableOpacity onPress={()=>_showDialog()}
                              disabled={!isAcceptEnabled}
                              style={{
                                alignItems: 'center',
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                marginVertical: 10}}>
              <Text style={styles.subtitle}>
                Accept Issue
              </Text>
              <View style={{flexDirection:'row', alignItems:'center'}}>
                <AntDesign
                style={{marginRight: 5}}
                  name={"rightsquare"}
                  size={35}
                  color={isAcceptEnabled ? colors.primary : colors.disabled}
              />
              <Feather name="help-circle" size={24} color={'gray'} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity disabled={!isRecordResolutionEnabled} style={{alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10}}>
              <Text style={styles.subtitle}>
                Record Steps Taken
              </Text>
              <View style={{flexDirection:'row', alignItems:'center'}}>
                <AntDesign
                    style={{marginRight: 5}}
                  name={"rightsquare"}
                  size={35}
                  color={isRecordResolutionEnabled ? colors.primary : colors.disabled}
              />
              <Feather name="help-circle" size={24} color={'gray'} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity disabled={!isRecordResolutionEnabled} style={{alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10}}>
              <Text style={styles.subtitle}>
                Record Resolution
              </Text>
              <View style={{flexDirection:'row', alignItems:'center'}}>
                <AntDesign
                style={{marginRight: 5}}
                  name={"rightsquare"}
                  size={35}
                  color={isRecordResolutionEnabled ? colors.primary : colors.disabled}

                />
              <Feather name="help-circle" size={24} color={'gray'} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity disabled={!isRateAppealEnabled} style={{alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10}}>
              <Text style={styles.subtitle}>
                Rate & Appeal
              </Text>
              <View style={{flexDirection:'row', alignItems:'center'}}>
                <AntDesign
                style={{marginRight: 5}}
                  name={"rightsquare"}
                  size={35}
                  color={isRateAppealEnabled ? colors.primary : colors.disabled}

                />
              <Feather name="help-circle" size={24} color={'gray'} />
              </View>
            </TouchableOpacity>

          </View>
          <TouchableOpacity disabled={!isRecordResolutionEnabled} style={{alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10, padding: 15}}>
            <Text style={styles.subtitle}>
               Escalate
            </Text>
            <View style={{flexDirection:'row', alignItems:'center'}}>
              <AntDesign
                  style={{marginRight: 5}}
                  name={"rightsquare"}
                  size={35}
                  color={isRecordResolutionEnabled ? colors.primary : colors.disabled}

              />
              <Feather name="help-circle" size={24} color={'gray'} />
            </View>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
      {/*REJECT MODAL*/}
      <Portal>
          <Dialog
              visible={rejectDialog}
              onDismiss={_hideDialog}>
            <Dialog.Content>
              <Paragraph>You are rejecting this complaint for consideration. Please enter a reason for consideration.</Paragraph>
              <TextInput multiline style={{marginTop: 10}} mode={'outlined'} theme={theme}
                         onChangeText={onChangeReason}
                         value={reason}

              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                  theme={theme}
                  style={{ alignSelf: "center", backgroundColor: '#d4d4d4' }}
                  labelStyle={{ color: "white", fontFamily: "Poppins_500Medium" }}
                  mode="contained"
                  onPress={()=>{}}
              >
                CANCEL
              </Button>
              <Button
                  theme={theme}
                  style={{ alignSelf: "center", margin: 24 }}
                  labelStyle={{ color: "white", fontFamily: "Poppins_500Medium" }}
                  mode="contained"
                  onPress={rejectIssue}
              >
                SUBMIT
              </Button>
            </Dialog.Actions>
          </Dialog>
      </Portal>


      {/*ACCEPT MODAL*/}
      <Portal>
        <Dialog
            visible={acceptDialog}
            onDismiss={_hideDialog}>
          {!acceptedDialog && <Dialog.Title>Accept Issue?</Dialog.Title>}
          <Dialog.Content>
            {!acceptDialog ? <Paragraph>Are you accepting this is a grievance relevant to the project? Or are you rejecting because it is not relevant?</Paragraph>
                : <Paragraph>You have accepted this complaint into the system.  Notifications have been sent to the citizen and the original recorder of the complaint.</Paragraph>}
          </Dialog.Content>
          {!acceptedDialog ?<Dialog.Actions>
            <Button
                theme={theme}
                style={{alignSelf: "center", backgroundColor: '#d4d4d4'}}
                labelStyle={{color: "white", fontFamily: "Poppins_500Medium"}}
                mode="contained"
                onPress={_showRejectDialog}
            >
              REJECT
            </Button>
            <Button
                theme={theme}
                style={{alignSelf: "center", margin: 24}}
                labelStyle={{color: "white", fontFamily: "Poppins_500Medium"}}
                mode="contained"
                onPress={acceptIssue}
            >
              ACCEPT
            </Button>
          </Dialog.Actions>
              :
              <Dialog.Actions>
                <Button
                    theme={theme}
                    style={{alignSelf: "center", margin: 24}}
                    labelStyle={{color: "white", fontFamily: "Poppins_500Medium"}}
                    mode="contained"
                    onPress={_hideDialog}
                >
            FINISHED
          </Button></Dialog.Actions>}
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

export default Content;

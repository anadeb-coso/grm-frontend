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
import { Button, RadioButton, TextInput } from "react-native-paper";
import { colors } from "../../../../utils/colors";
import CustomDropDownPicker from "../../../../components/CustomDropDownPicker/CustomDropDownPicker";
import i18n from "i18n-js";
import moment from "moment";
import {AntDesign, Feather} from "@expo/vector-icons";


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
  const [currentDate, setCurrentDate] = useState(moment());
  const [citizenName, setCitizenName] = useState();
  const [isAcceptEnabled, setIsAcceptEnabled] = useState(false);
  const [isRecordResolutionEnabled, setIsRecordResolutionEnabled] = useState(false);
  const [isRateAppealEnabled, setIsRateAppealEnabled] = useState(false);
  const [isIssueAssignedToMe, setIsIssueAssignedToMe] = useState(false);
  const goToDetails = () => navigation.jumpTo('IssueDetail');
  const [items, setItems] = useState([
    { label: i18n.t("step_1_method_1"), value: "text-sms" },
    { label: i18n.t("step_1_method_2"), value: "whatsapp" },
    { label: i18n.t("step_1_method_3"), value: "email" },
  ]);

  useEffect(()=>{
    const isAssignedToMyself = true;
    // TODO: create hook to check if the issue is assigned to me

    if(issue.citizen_type !== 1){
      setCitizenName(issue.citizen)
    } else if(issue.citizen_type === 1){
      setCitizenName(isAssignedToMyself ? issue.citizen : "Anonymous")
    }

    function _isIssueAssignedToMe() {
      if(issue.assignee && issue.assignee.id) {
        return issue.reporter.id === issue.assignee.id
      }
    }

    setIsIssueAssignedToMe(_isIssueAssignedToMe())

  },[])

  useEffect(()=>{
    function _isAcceptEnabled(x) {
      if(x.initial_status && isIssueAssignedToMe) {
        return (issue.status?.id === x.id);
      }
    }

    function _isRecordResolutionEnabled(x) {
      if((!x.initial_status || !x.final_status) && isIssueAssignedToMe) {
        return issue.status?.id === x.id;
      }
    }

    function _isRateAppealEnabled(x) {
      if(x.final_status && !isIssueAssignedToMe) {
        return issue.status?.id === x.id;
      }
    }

    if(statuses){
      console.log(issue)
      console.log(statuses)
      setIsAcceptEnabled(statuses.some(_isAcceptEnabled));
      setIsRecordResolutionEnabled(statuses.some(_isRecordResolutionEnabled));
      setIsRateAppealEnabled(statuses.some(_isRateAppealEnabled));
    }
  },[statuses])

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
            <TouchableOpacity disabled={!isAcceptEnabled} style={{alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10}}>
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
    </ScrollView>
  );
}

export default Content;

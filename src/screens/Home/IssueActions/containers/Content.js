import { AntDesign, Feather } from '@expo/vector-icons';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Dialog, Paragraph, Portal, TextInput } from 'react-native-paper';
import { colors } from '../../../../utils/colors';
import { LocalGRMDatabase } from '../../../../utils/databaseManager';
import { styles } from './Content.styles';

const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: 'white',
    placeholder: '#dedede',
    text: '#707070',
  },
};

function Content({ issue, navigation, statuses = [], eadl }) {
  const { t } = useTranslation();

  const [acceptDialog, setAcceptDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [recordStepsDialog, setRecordStepsDialog] = useState(false);
  const [escalateDialog, setEscalateDialog] = useState(false);
  const [recordResolutionDialog, setRecordResolutionDialog] = useState(false);
  const [notResolveDialog, setNotResolveDialog] = useState(false);
  const [acceptedDialog, setAcceptedDialog] = useState(false);
  const [rejectedDialog, setRejectedDialog] = useState(false);
  const [escalatedDialog, setEscalatedDialog] = useState(false);
  const [disableEscalation, setDisableEscalation] = useState(false);
  const [recordedSteps, setRecordedSteps] = useState(false);
  const [recordedResolution, setRecordedResolution] = useState(false);
  const [currentDate, setCurrentDate] = useState(moment());
  const [citizenName, setCitizenName] = useState();
  const [reason, onChangeReason] = useState('');
  const [escalateComment, onChangeEscalateComment] = useState('');
  const [comment, onChangeComment] = useState('');
  const [resolution, onChangeResolution] = useState('');
  const [notResolutionComment, onChangeNotResolutionComment] = useState('');
  const [isAcceptEnabled, setIsAcceptEnabled] = useState(false);
  const [isRecordResolutionEnabled, setIsRecordResolutionEnabled] = useState(false);
  const [isNotResolveEnabled, setIsNotResolveEnabled] = useState(false);
  const [isRateAppealEnabled, setIsRateAppealEnabled] = useState(false);
  const [isIssueAssignedToMe, setIsIssueAssignedToMe] = useState(false);
  const goToDetails = () => navigation.jumpTo('IssueDetail');
  const goToHistory = () => {
    setRecordedSteps(false);
    _hideRecordStepsDialog();
    navigation.jumpTo('History');
  };
  const _showDialog = () => setAcceptDialog(true);
  const _showEscalateDialog = () => setEscalateDialog(true);
  const _showRecordStepsDialog = () => setRecordStepsDialog(true);
  const _hideRecordStepsDialog = () => setRecordStepsDialog(false);
  const _hideEscalateDialog = () => setEscalateDialog(false);
  const _showRecordResolutionDialog = () => setRecordResolutionDialog(true);
  const _hideRecordResolutionDialog = () => setRecordResolutionDialog(false);
  const _showNotresolveDialog = () => setNotResolveDialog(true);
  const _hideNotresolveDialog = () => setNotResolveDialog(false);
  const _hideDialog = () => {
    setAcceptDialog(false);
    setAcceptedDialog(false);
  };
  const _showRejectDialog = () => {
    _hideDialog();
    setRejectDialog(true);
  };
  const _hideRejectDialog = () => setRejectDialog(false);

  const updateActionButtons = () => {
    function _isAcceptEnabled(x) {
      if ((x.initial_status || x.final_status || x.rejected_status || x.unresolved_status) && issue.category.id != 2 && isIssueAssignedToMe) {
        return issue.status?.id === x.id;
      }
    }

    function _isRecordResolutionEnabled(x) {
      if (x.open_status && isIssueAssignedToMe) {
        return issue.status?.id === x.id;
      }
    }

    function _isNotResolveEnabled(x) {
      if (!x.rejected_status && !x.final_status && !x.unresolved_status && issue.category.id != 2 && isIssueAssignedToMe) {
        return issue.status?.id === x.id;
      }
    }

    function _isRateAppealEnabled(x) {
      if (x.final_status && !isIssueAssignedToMe) {
        return issue.status?.id === x.id;
      }
    }

    if (statuses) {
      setIsAcceptEnabled(statuses.some(_isAcceptEnabled));
      setIsRecordResolutionEnabled(statuses.some(_isRecordResolutionEnabled));
      setIsNotResolveEnabled(statuses.some(_isNotResolveEnabled));
      setIsRateAppealEnabled(statuses.some(_isRateAppealEnabled));
    }
  };

  const issue_status_stories = (status, coment_message) => {
    issue.issue_status_stories = issue.issue_status_stories ?? []
    issue.issue_status_stories?.unshift({
      status: {name: status.name, id: status.id},
      user: {
          id: eadl?.representative?.id,
          username: null,
          full_name: eadl?.representative?.name
      },
      comment: coment_message,
      datetime: moment()
    });
    LocalGRMDatabase.upsert(issue._id, (doc) => {
      doc = issue;
      return doc;
    })
      .then(() => {
        
      })
      .catch((err) => {
        console.log('Error', err);
      });
  };

  const acceptIssue = () => {
    const newStatus = statuses.find((x) => x.open_status === true);
    issue.comments?.unshift({
      name: issue.reporter.name,
      id: eadl.representative?.id,
      comment: (issue.status.id === 3 || issue.status.id === 4) ? t('issue_was_re_opened') : t('issue_was_accepted'),
      due_at: moment(),
    });
    saveIssueStatus(newStatus, 'accept');
    issue_status_stories(newStatus, 
      `${((issue.status.id === 3 || issue.status.id === 4) ? t('issue_was_re_opened') : t('issue_was_accepted'))}\n${reason}`
    );
  };

  const rejectIssue = () => {
    const newStatus = statuses.find((x) => x.rejected_status === true);
    issue.comments?.unshift({
      name: issue.reporter.name,
      id: eadl.representative?.id,
      comment: t('issue_was_rejected'),
      due_at: moment(),
    });
    saveIssueStatus(newStatus, 'reject');
    issue_status_stories(newStatus, `${t('issue_was_rejected')}\n${reason}`);
  };

  const escalateIssue = () => {
    issue.escalate_flag = true;
    issue.escalation_reasons = issue.escalation_reasons ?? []
    issue.escalation_reasons?.unshift({
      id: eadl?.representative?.id,
      name: eadl?.representative?.name,
      comment: escalateComment,
      due_at: moment(),
    });
    issue.comments?.unshift({
      name: issue.reporter.name,
      id: eadl.representative?.id,
      comment: t('issue_was_escalated'),
      due_at: moment(),
    });
    saveIssueStatus();
    setDisableEscalation(true);
    setEscalatedDialog(true);

    const newStatus = statuses.find((x) => x.id === issue.status.id);
    issue_status_stories(newStatus, `${t('issue_was_escalated')}\n${escalateComment}`);
  };

  const recordStep = () => {
    issue.comments?.unshift({
      name: issue.reporter.name,
      id: eadl.representative?.id,
      comment,
      due_at: moment(),
    });
    saveIssueStatus();
    setRecordedSteps(true);

    const newStatus = statuses.find((x) => x.id === issue.status.id);
    issue_status_stories(newStatus, comment);
  };

  const recordResolution = () => {
    setRecordedResolution(true);
  };

  const recordResolutionConfirmation = () => {
    issue.research_result = resolution;
    const newStatus = statuses.find((x) => x.final_status === true);
    issue.comments?.unshift({
      name: issue.reporter.name,
      id: eadl.representative?.id,
      comment: t('issue_was_resolved'),
      due_at: moment(),
    });
    saveIssueStatus(newStatus, 'record_resolution');
    _hideRecordResolutionDialog();
    issue_status_stories(newStatus, `${t('issue_was_resolved')}\n${resolution}`);
  };

  const notResolve = () => {
    issue.unresolved_reason = notResolutionComment;
    issue.unresolved_date = moment();
    const newStatus = statuses.find((x) => x.unresolved_status === true);
    issue.comments?.unshift({
      name: issue.reporter.name,
      id: eadl.representative?.id,
      comment: t('issue_was_not_resolved'),
      due_at: moment(),
    });
    saveIssueStatus(newStatus, 'not_resolve');
    _hideNotresolveDialog();
    issue_status_stories(newStatus, `${t('issue_was_not_resolved')}\n${notResolutionComment}`);
  };

  const saveIssueStatus = (newStatus, type = 'none') => {
    if (newStatus) {
      issue.status = {
        id: newStatus.id,
        name: newStatus.name,
      };
    }
    if (type === 'rejected') {
      issue.reject_reason = reason;
    }
    LocalGRMDatabase.upsert(issue._id, (doc) => {
      doc = issue;
      return doc;
    })
      .then(() => {
        updateActionButtons();
        if (type === 'accept') {
          setAcceptedDialog(true);
        } else if (type === 'reject') {
          setRejectedDialog(true);
        } else if (type === 'record_resolution') {
          setRecordedResolution(false);
          _hideRecordResolutionDialog();
        }else if(type == 'not_resolve'){
          setNotResolveDialog(false);
          _hideNotresolveDialog();
        }
      })
      .catch((err) => {
        console.log('Error', err);
      });
  };

  useEffect(() => {
    function _isIssueAssignedToMe() {
      if (issue.assignee && issue.assignee.id) {
        // return issue.reporter.id === issue.assignee.id;
        return issue.assignee.id === eadl.representative?.id;
      }
    }
    setIsIssueAssignedToMe(_isIssueAssignedToMe());

    if (issue.citizen_type !== 1) {
      setCitizenName(issue.citizen);
    } else if (issue.citizen_type === 1) {
      setCitizenName(_isIssueAssignedToMe() ? issue.citizen : 'Anonymous');
    }
  }, []);

  useEffect(() => {
    updateActionButtons();
  }, [statuses, issue]);

  return (
    <ScrollView>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'position' : null}>
        <View style={{ padding: 23 }}>
          <Text style={styles.stepDescription}>
            {citizenName}, {issue.intake_date && moment(issue.intake_date).format('DD-MMM-YYYY')}{' '}
            {issue.intake_date && currentDate.diff(issue.intake_date, 'days')} {t('days_ago')}
          </Text>
          <Text style={styles.stepDescription}>
            {t('status_label')} <Text style={{ color: colors.primary }}>{issue.status?.name}</Text>
          </Text>
          <Text style={styles.stepNote}>{issue.description?.substring(0, 170)}</Text>
          <View style={{ paddingHorizontal: 50 }}>
            <Button
              theme={theme}
              style={{ alignSelf: 'center', margin: 24 }}
              labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
              mode="contained"
              onPress={goToDetails}
            >
              {t('view_details')}
            </Button>
          </View>

          {/* ACTION BUTTONS */}
          <View
            style={{ borderWidth: 1, borderRadius: 15, padding: 15, borderColor: colors.lightgray }}
          >
            <TouchableOpacity
              onPress={() => _showDialog()}
              disabled={!isAcceptEnabled}
              style={{
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginVertical: 10,
              }}
            >
              <Text style={styles.subtitle}>{([3, 4, 5].includes(issue.status.id)) ? t('re_open_issue') : t('accept_issue')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AntDesign
                  style={{ marginRight: 5 }}
                  name="rightsquare"
                  size={35}
                  color={isAcceptEnabled ? colors.primary : colors.disabled}
                />
                <Feather name="help-circle" size={24} color="gray" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={_showRecordStepsDialog}
              disabled={!isRecordResolutionEnabled}
              style={{
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginVertical: 10,
              }}
            >
              <Text ellipsizeMode="tail" numberOfLines={1} style={styles.subtitle}>
                {t('record_steps_taken').substring(0, 28)}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AntDesign
                  style={{ marginRight: 5 }}
                  name="rightsquare"
                  size={35}
                  color={isRecordResolutionEnabled ? colors.primary : colors.disabled}
                />
                <Feather name="help-circle" size={24} color="gray" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={_showRecordResolutionDialog}
              disabled={!isRecordResolutionEnabled}
              style={{
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginVertical: 10,
              }}
            >
              <Text style={styles.subtitle}>{t('record_resolution')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AntDesign
                  style={{ marginRight: 5 }}
                  name="rightsquare"
                  size={35}
                  color={isRecordResolutionEnabled ? colors.primary : colors.disabled}
                />
                <Feather name="help-circle" size={24} color="gray" />
              </View>
            </TouchableOpacity>

            {/* Not resolve */}
            <TouchableOpacity
              onPress={_showNotresolveDialog}
              disabled={!isNotResolveEnabled}
              style={{
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginVertical: 10,
              }}
            >
              <Text style={styles.subtitle}>{t('record_not_resolve')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AntDesign
                  style={{ marginRight: 5 }}
                  name="rightsquare"
                  size={35}
                  color={isNotResolveEnabled ? colors.primary : colors.disabled}
                />
                <Feather name="help-circle" size={24} color="gray" />
              </View>
            </TouchableOpacity>
            {/* End Not resolve */}

            {/* <TouchableOpacity
              disabled={!isRateAppealEnabled}
              style={{
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginVertical: 10,
              }}
            >
              <Text style={styles.subtitle}>{t('rate_appeal')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AntDesign
                  style={{ marginRight: 5 }}
                  name="rightsquare"
                  size={35}
                  color={isRateAppealEnabled ? colors.primary : colors.disabled}
                />
                <Feather name="help-circle" size={24} color="gray" />
              </View>
            </TouchableOpacity> */}
          </View>
          <TouchableOpacity
            onPress={_showEscalateDialog}
            // disabled={disableEscalation || !isRecordResolutionEnabled || issue.escalate_flag}
            disabled={!issue.status.id == 5}
            style={{
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginVertical: 10,
              padding: 15,
            }}
          >
            <Text style={styles.subtitle}>{t('escalate')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AntDesign
                style={{ marginRight: 5 }}
                name="rightsquare"
                size={35}
                // color={!disableEscalation && isRecordResolutionEnabled ? colors.primary : colors.disabled}
                color={issue.status.id == 5 ? colors.primary : colors.disabled}
              />
              <Feather name="help-circle" size={24} color="gray" />
            </View>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* REJECT MODAL */}
      <Portal>
        <Dialog visible={rejectDialog} onDismiss={_hideRejectDialog}>
          <Dialog.Content>
            {!rejectedDialog ? (
              <Paragraph>{t('you_are_rejecting')}</Paragraph>
            ) : (
              <Paragraph>{t('complaint_rejected')}</Paragraph>
            )}
            {!rejectedDialog && (
              <TextInput
                multiline
                style={{ marginTop: 10 }}
                mode="outlined"
                theme={theme}
                onChangeText={onChangeReason}
              />
            )}
          </Dialog.Content>
          {!rejectedDialog ? (
            <Dialog.Actions>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', backgroundColor: '#d4d4d4' }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={_hideRejectDialog}
              >
                {t('cancel')}
              </Button>
              <Button
                disabled={reason === ''}
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={rejectIssue}
              >
                {t('submit')}
              </Button>
            </Dialog.Actions>
          ) : (
            <Dialog.Actions>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={_hideRejectDialog}
              >
                {t('finished')}
              </Button>
            </Dialog.Actions>
          )}
        </Dialog>
      </Portal>

      {/* ACCEPT MODAL */}
      <Portal>
        <Dialog visible={acceptDialog} onDismiss={_hideDialog}>
          {!acceptedDialog && <Dialog.Title>{([3, 4, 5].includes(issue.status.id)) ? (t('re_open_issue') + " ?") : (t('accept_issue') + "?")}</Dialog.Title>}
          <Dialog.Content>
            {!acceptedDialog ? (
              <Paragraph>{t('are_you_accepting')}</Paragraph>
            ) : (
              <Paragraph>{t('you_have_accepted')}</Paragraph>
            )}
          </Dialog.Content>
          {!acceptedDialog ? (
            <Dialog.Actions>
               {/* {
                (issue.status.id === 3 || issue.status.id === 4) 
                  ? 
                    <></>
                  : 
                    <Button
                      theme={theme}
                      style={{ alignSelf: 'center', backgroundColor: '#d4d4d4' }}
                      labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                      mode="contained"
                      onPress={_showRejectDialog}
                    >
                      {t('reject')}
                    </Button>
                } */}
              <Button
                theme={theme}
                style={{ alignSelf: 'center', backgroundColor: '#d4d4d4' }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={_hideDialog}
              >
                {t('cancel')}
              </Button>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={acceptIssue}
              >
                {([3, 4, 5].includes(issue.status.id)) ? t('re_open_issue') : t('accept')}
              </Button>
            </Dialog.Actions>
          ) : (
            <Dialog.Actions>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={_hideDialog}
              >
                {t('finished')}
              </Button>
            </Dialog.Actions>
          )}
        </Dialog>
      </Portal>

      {/* ESCALATE MODAL */}
      <Portal>
        <Dialog visible={escalateDialog} onDismiss={_hideEscalateDialog}>
          <Dialog.Content>
            {!escalatedDialog ? (
              <Paragraph>{t('you_are_escalating')}</Paragraph>
            ) : (
              <Paragraph>{t('escalated_text')}</Paragraph>
            )}
            {!escalatedDialog && (
              <TextInput
                multiline
                style={{ marginTop: 10 }}
                mode="outlined"
                theme={theme}
                onChangeText={onChangeEscalateComment}
              />
            )}
          </Dialog.Content>
          {!escalatedDialog ? (
            <Dialog.Actions>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', backgroundColor: '#d4d4d4' }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={_hideEscalateDialog}
              >
                {t('cancel')}
              </Button>
              <Button
                disabled={escalateComment === ''}
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={escalateIssue}
              >
                {t('submit')}
              </Button>
            </Dialog.Actions>
          ) : (
            <Dialog.Actions>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={() => {
                  _hideEscalateDialog();
                  setEscalatedDialog(false);
                }}
              >
                {t('finished')}
              </Button>
            </Dialog.Actions>
          )}
        </Dialog>
      </Portal>

      {/* RECORD STEPS MODAL */}
      <Portal>
        <Dialog visible={recordStepsDialog} onDismiss={_hideRecordStepsDialog}>
          <Dialog.Content>
            {!recordedSteps ? (
              <Paragraph>{t('record_steps_text')}</Paragraph>
            ) : (
              <Paragraph>{t('recorded_comment')}</Paragraph>
            )}
            {!recordedSteps && (
              <TextInput
                multiline
                style={{ marginTop: 10 }}
                mode="outlined"
                theme={theme}
                onChangeText={onChangeComment}
              />
            )}
          </Dialog.Content>
          {!recordedSteps ? (
            <Dialog.Actions>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', backgroundColor: '#d4d4d4' }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={_hideRecordStepsDialog}
              >
                {t('cancel')}
              </Button>
              <Button
                disabled={comment === ''}
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={recordStep}
              >
                {t('submit')}
              </Button>
            </Dialog.Actions>
          ) : (
            <Dialog.Actions>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={() => {
                  _hideRecordStepsDialog();
                  setRecordedSteps(false);
                }}
              >
                {t('finished')}
              </Button>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={goToHistory}
              >
                {t('view_history')}
              </Button>
            </Dialog.Actions>
          )}
        </Dialog>
      </Portal>

      <Portal>
        <Dialog visible={recordResolutionDialog} onDismiss={_hideRecordResolutionDialog}>
          <Dialog.Content>
            {!recordedResolution ? (
              <Paragraph>{t('summarize_resolution')}</Paragraph>
            ) : (
              <Paragraph>{t('please_confirm_resolution')}</Paragraph>
            )}
            {!recordedResolution ? (
              <TextInput
                multiline
                style={{ marginTop: 10 }}
                mode="outlined"
                theme={theme}
                onChangeText={onChangeResolution}
              />
            ) : (
              <Text>
                {'\n'}"{resolution}"
              </Text>
            )}
          </Dialog.Content>
          {!recordedResolution ? (
            <Dialog.Actions>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', backgroundColor: '#d4d4d4' }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={() => {
                  _hideRecordStepsDialog();
                  _hideRecordResolutionDialog();
                }}
              >
                {t('cancel')}
              </Button>
              <Button
                disabled={resolution === ''}
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={recordResolution}
              >
                {t('submit')}
              </Button>
            </Dialog.Actions>
          ) : (
            <Dialog.Actions>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', backgroundColor: '#d4d4d4' }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={() => {
                  setRecordedResolution(false);
                  _hideRecordResolutionDialog();
                }}
              >
                {t('cancel')}
              </Button>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={recordResolutionConfirmation}
              >
                {t('confirm')}
              </Button>
            </Dialog.Actions>
          )}
        </Dialog>
      </Portal>
          
      {/* Dialog NOt resolve */}
      <Portal>
        <Dialog visible={notResolveDialog} onDismiss={_hideNotresolveDialog}>
          <Dialog.Content>
            
            <Paragraph>{t('record_not_resolve')}</Paragraph>

            <TextInput
                multiline
                style={{ marginTop: 10 }}
                mode="outlined"
                theme={theme}
                onChangeText={onChangeNotResolutionComment}
              />

          </Dialog.Content>
          
            <Dialog.Actions>
              <Button
                theme={theme}
                style={{ alignSelf: 'center', backgroundColor: '#d4d4d4' }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={_hideNotresolveDialog}
              >
                {t('cancel')}
              </Button>
              <Button
                disabled={notResolutionComment === ''}
                theme={theme}
                style={{ alignSelf: 'center', margin: 24 }}
                labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
                mode="contained"
                onPress={notResolve}
              >
                {t('submit')}
              </Button>
            </Dialog.Actions>
            
        </Dialog>
      </Portal>
      {/* Dialog NOt resolve */}

    </ScrollView>
  );
}

export default Content;

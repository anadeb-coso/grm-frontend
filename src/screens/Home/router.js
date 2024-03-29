import { Feather, Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { useTranslation } from 'react-i18next';
import posed from 'react-native-pose';
import BottomTabNavigator from '../../components/Navigation/BottomTabNavigator';
import { colors } from '../../utils/colors';
import BudgetAllocation from './BudgetAllocation/BudgetAllocation';
import BudgetLog from './BudgetLog/BudgetLog';
import CitizenReport from './CitizenReport/CitizenReport';
import CitizenReportContactInfo from './CitizenReportContactInfo/CitizenReportContactInfo';
import CitizenReportIntro from './CitizenReportIntro/CitizenReportIntro';
import CitizenReportStep2 from './CitizenReportStep2/CitizenReportStep2';
import CitizenReportStep3 from './CitizenReportStep3/CitizenReportStep3';
import CitizenReportStep4 from './CitizenReportStep4/CitizenReportStep4';
import Diagnostics from './Diagnostics';
import DocumentTask from './DocumentTask/DocumentTask';
import GRM from './GRM/GRM';
import IssueDetail from './IssueDetail/IssueDetail';
import IssueSearch from './IssueSearch/IssueSearch';
import Notifications from './Notifications';
import ParticipatoryBudgetingList from './ParticipatoryBudgeting/ParticipatoryBudgetingList';
import PhaseTasks from './PhaseTasks/PhaseTasks';
import RegisterSubprojects from './RegisterSubprojects/RegisterSubprojects';
import RegisterVotesActivity from './RegisterVotesActivity/RegisterVotesActivity';
import SyncAttachments from './SyncAttachments/SyncAttachments';
import SyncDatas from './SyncDatas/SyncDatas';
import WorkInProgress from './WorkInProgress';

import CitizenReportLocationStep from './CitizenReportLocationStep/CitizenReportLocationStep';
import IssueActions from './IssueActions/IssueActions';
import IssueHistory from './IssueHistory/IssueHistory';
import IssuesStatistic from './Statistic';

const iconConfig = {
  focused: {
    x: 0,
    transition: { type: 'tween', ease: 'linear' },
  },
  unfocused: { x: 0 },
};

const customHeaderOptions = (label) => ({
  headerBackTitle: () => null,
  headerTintColor: '#00bc82',
  headerTitle: label,
  headerTitleAllowFontScaling: true,
  headerTitleAlign: 'center',
  headerTitleStyle: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 20,
    fontWeight: '500',
    fontStyle: 'normal',
    letterSpacing: 0,
    textAlign: 'left',
    color: '#373737',
  },
});

const Tab = createBottomTabNavigator();
const TopTab = createMaterialTopTabNavigator();
const AnimatedFeatherIcon = posed(Feather)(iconConfig);
const AnimatedIonicons = posed(Ionicons)(iconConfig);

const HomeStack = createStackNavigator();
const NotificationsStack = createStackNavigator();
function DashboardStackScreen() {
  const { t } = useTranslation();

  return (
    <HomeStack.Navigator>
      {/* GRM Module */}
      <HomeStack.Screen
        name="GRM"
        component={GRM}
        options={({ navigation, route }) => customHeaderOptions('MGP')}
      />
      <HomeStack.Screen
        name="CitizenReportIntro"
        component={CitizenReportIntro}
        options={({ navigation, route }) => customHeaderOptions(t('citizen_input_header'))}
      />
      <HomeStack.Screen
        name="CitizenReport"
        component={CitizenReport}
        options={({ navigation, route }) => customHeaderOptions(t('citizen_input_header'))}
      />
      <HomeStack.Screen
        name="CitizenReportContactInfo"
        component={CitizenReportContactInfo}
        options={({ navigation, route }) => customHeaderOptions(t('citizen_input_header'))}
      />
      <HomeStack.Screen
        name="CitizenReportStep2"
        component={CitizenReportStep2}
        options={({ navigation, route }) => customHeaderOptions(t('citizen_input_header'))}
      />
      <HomeStack.Screen
        name="CitizenReportLocationStep"
        component={CitizenReportLocationStep}
        options={({ navigation, route }) => customHeaderOptions(t('citizen_input_header'))}
      />
      <HomeStack.Screen
        name="CitizenReportStep3"
        component={CitizenReportStep3}
        options={({ navigation, route }) => customHeaderOptions(t('citizen_input_header'))}
      />
      <HomeStack.Screen
        name="CitizenReportStep4"
        component={CitizenReportStep4}
        options={({ navigation, route }) => ({
          ...customHeaderOptions(t('citizen_input_header')),
          headerLeft: () => null,
        })}
      />

      <HomeStack.Screen
        name="IssueSearch"
        component={IssueSearch}
        options={({ navigation, route }) => customHeaderOptions(t('summary_of_your_work'))}
      />

      {/* <HomeStack.Screen */}
      {/*  name="IssueDetail" */}
      {/*  component={IssueDetail} */}
      {/*  options={({ navigation, route }) => */}
      {/*    customHeaderOptions(route.params.item?.title) */}
      {/*  } */}
      {/* /> */}

      <HomeStack.Screen
        name="IssueDetailTabs"
        component={IssueDetailTabsStack}
        options={({ navigation, route }) => customHeaderOptions('e3GRM')}
      />

      <HomeStack.Screen
        name="RegisterSubprojects"
        component={RegisterSubprojects}
        options={({ navigation, route }) => customHeaderOptions('Engagement Citoyen')}
      />
      <HomeStack.Screen
        name="BudgetAllocation"
        component={BudgetAllocation}
        options={({ navigation, route }) => customHeaderOptions('Budgetisation')}
      />
      <HomeStack.Screen
        name="BudgetLog"
        component={BudgetLog}
        options={({ navigation, route }) => customHeaderOptions('Budget Log')}
      />
      <HomeStack.Screen
        name="RegisterVotesActivity"
        component={RegisterVotesActivity}
        options={({ navigation, route }) => customHeaderOptions('Enregistrer les votes')}
      />
      <HomeStack.Screen
        name="ParticipatoryBudgetingList"
        component={ParticipatoryBudgetingList}
        options={({ navigation, route }) => customHeaderOptions('Budget Participatif')}
      />
      <HomeStack.Screen
        name="PhaseTasks"
        component={PhaseTasks}
        options={({ navigation, route }) => customHeaderOptions('Phase Tasks')}
      />
      <HomeStack.Screen
        name="DocumentTask"
        component={DocumentTask}
        options={({ navigation, route }) => customHeaderOptions('Document Task')}
      />
      <HomeStack.Screen
        name="SyncAttachments"
        component={SyncAttachments}
        options={({ navigation, route }) => customHeaderOptions(t('sync_files_abbreviation'))}
      />
      <HomeStack.Screen
        name="SyncDatas"
        component={SyncDatas}
        options={({ navigation, route }) => customHeaderOptions(t('sync_datas_abbreviation'))}
      />
      <HomeStack.Screen
        name="IssuesStatistic"
        component={IssuesStatistic}
        options={({ navigation, route }) => customHeaderOptions(t('diagnostics'))}
      />
      {/* <HomeStack.Screen name="Details" component={WorkInProgress} /> */}
    </HomeStack.Navigator>
  );
}

function NotificationsStackScreen() {
  return (
    <NotificationsStack.Navigator>
      <NotificationsStack.Screen
        options={{
          headerShown: true,
          headerTitleStyle: {
            alignSelf: 'center',
            fontFamily: 'Poppins_500Medium',
          },
        }}
        name="Notifications"
        component={Notifications}
      />
      <NotificationsStack.Screen name="WorkInProgress" component={WorkInProgress} />
    </NotificationsStack.Navigator>
  );
}

function IssueDetailTabsStack(props) {
  const { t } = useTranslation();

  const temp = props.route.params.item;
  return (
    <TopTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarIndicatorStyle: { backgroundColor: colors.primary },
      }}
      initialRouteName="Actions"
    >
      <TopTab.Screen
        name="Actions"
        initialParams={{ item: temp }}
        options={{ tabBarLabel: t('actions') }}
        component={IssueActions}
      />
      <TopTab.Screen
        name="IssueDetail"
        initialParams={{ item: temp }}
        options={{ tabBarLabel: t('details') }}
        component={IssueDetail}
      />
      <TopTab.Screen
        name="History"
        initialParams={{ item: temp }}
        options={{ tabBarLabel: t('history') }}
        component={IssueHistory}
      />
    </TopTab.Navigator>
  );
}

function HomeRouter() {
  return (
    <BottomTabNavigator>
      <Tab.Screen
        name="Dashboard"
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <AnimatedFeatherIcon
              pose={focused ? 'focused' : 'unfocused'}
              name="home"
              size={size}
              color={color}
            />
          ),
        }}
        component={DashboardStackScreen}
      />
      <Tab.Screen
        name="Notifications"
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <AnimatedIonicons
              pose={focused ? 'focused' : 'unfocused'}
              name="notifications-outline"
              size={size}
              color={color}
            />
          ),
        }}
        component={NotificationsStackScreen}
      />
      <Tab.Screen
        name="Diagnostics"
        options={{
          header: true,
          tabBarIcon: ({ focused, color, size }) => (
            <AnimatedIonicons
              pose={focused ? 'focused' : 'unfocused'}
              name="analytics"
              size={size}
              color={color}
            />
          ),
        }}
        component={Diagnostics}
      />
      <Tab.Screen
        name="Profile"
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <AnimatedFeatherIcon
              pose={focused ? 'focused' : 'unfocused'}
              name="user"
              size={size}
              color={color}
            />
          ),
        }}
        component={WorkInProgress}
      />
    </BottomTabNavigator>
  );
}

export default HomeRouter;

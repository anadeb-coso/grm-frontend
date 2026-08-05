import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View, RefreshControl } from 'react-native';
import Chart from '../../../../../assets/chart_line_solid.svg';
import FileIcon from '../../../../../assets/file_alt_regular.svg';
import SearchIcon from '../../../../../assets/magnifying-glass-solid.svg';
import SyncIcon from '../../../../../assets/sync_alt_solid.svg';
import TeamWorkIcon from '../../../../../assets/team-work.svg';
import BigCard from '../components/BigCard';
import SmallCard from '../components/SmallCard';
import { runSyncSafely } from '../../../../database/watermelonSyncManager';

function Content() {
  const { t } = useTranslation();

  const navigation = useNavigation();

  // Cet écran n'affiche lui-même aucune donnée dynamique (un simple menu de navigation) : tirer
  // pour rafraîchir ici ne met donc rien à jour visuellement, mais permet de déclencher une
  // synchronisation à la demande depuis l'écran d'accueil, dont profiteront les autres écrans
  // (liste des issues, statistiques, etc.) à la prochaine ouverture.
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await runSyncSafely();
    } catch (err) {
      console.log(err);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ paddingTop: 20 }}
      style={{ backgroundColor: 'white' }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <BigCard
        image={require('../../../../../assets/BG_9.png')}
        onCardPress={() => navigation.navigate('CitizenReportIntro')}
        title={t('collect_reports')}
        icon={<TeamWorkIcon />}
      />
      <View style={{ marginVertical: 20 }}>
        <BigCard
          image={require('../../../../../assets/purpleBg.png')}
          onCardPress={() => navigation.navigate('IssueSearch')}
          title={t('search_reports')}
          icon={
            <View style={{ padding: 15 }}>
              <SearchIcon />
            </View>
          }
        />
      </View>
      {/* <BigCard
        image={require('../../../../../assets/small-rectangle.png')}
        onCardPress={() => navigation.navigate('SyncAttachments')}
        title={t('sync_files')}
        icon={<SyncIcon />}
        // cardHeight={79}
      /> */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-evenly',
          borderRadius: 15,
        }}
      >
        <SmallCard
          image={require('../../../../../assets/BG_1.png')}
          onCardPress={() => navigation.navigate('SyncDatas')}
          title={t('sync_datas')}
          icon={<SyncIcon />}
        />
        <SmallCard
          image={require('../../../../../assets/BG_1.png')}
          onCardPress={() => navigation.navigate('SyncAttachments')}
          title={t('sync_files')}
          icon={<SyncIcon />}
        />
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-evenly',
          marginVertical: 20,
          borderRadius: 15,
        }}
      >
        <SmallCard
          image={require('../../../../../assets/BG_1.png')}
          onCardPress={() => navigation.navigate('IssuesStatistic')}
          title={t('diagnostics')}
          icon={<Chart />}
        />
        <SmallCard
          image={require('../../../../../assets/BG_2.png')}
          onCardPress={() => alert('Upcoming feature')}
          title={t('information')}
          icon={<FileIcon />}
        />
      </View>

      {/* <ReactNativeSwipeableViewStack
       // onSwipe={(swipedIndex) => this.onCardSwipe(swipedIndex)}
       initialSelectedIndex={1}
       data={[0, 1, 2, 3, 4, 5]}
       useNativeDrive={true}
       stackSpacing={Platform.OS === "ios" ? 30 : 20}
       onItemClicked={() => console.log("click")}
       pointerEvents="none"
       renderItem={(element) => (
         <Card
           pointerEvents="none"
           style={{
             width: screenWidth * 0.888,
             alignSelf: "center",
             borderRadius: 15,
             backgroundColor: "white",
             padding: 19,
           }}
         >
           <Headline
             style={{
               color: "#707070",
               fontWeight: "500",
             }}
           >
             Prochaine tâche
           </Headline>
           <Paragraph
             style={{
               color: "#707070",
             }}
           >
             Lorem Ipsum is simply dummy text of the printing and typesetting
             industry. Lorem Ipsum has been the industry’s standard dummy text
             ever since the 1500s.
           </Paragraph>
           <Button
             onPress={() => alert("hey")}
             style={{
               alignSelf: "flex-end",
               backgroundColor: "#24c38b",
               width: 115,
               marginTop: 20,
               borderRadius: 7,
               padding: 5,
             }}
             labelStyle={{
               color: "white",
             }}
           >
             Tâches
           </Button>
         </Card>
       )}
      /> */}
    </ScrollView>
  );
}

export default Content;

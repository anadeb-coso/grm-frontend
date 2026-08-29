import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../../../utils/colors';

// Pagination "scroll infini" : on n'affiche que PAGE_SIZE issues au départ, +PAGE_SIZE à chaque
// fois que l'utilisateur approche du bas de la liste.
const PAGE_SIZE = 10;
import SearchBar from "../../../../components/Search/SearchBar";
import CustomDropDownPickerWithRender from '../../../../components/CustomDropDownPicker/CustomDropDownPickerWithRender';

// Palette de statut (ids legacy — cf. utils/issueLegacyShape.js) :
// 1 Enregistrée · 2 En cours de traitement · 3 Résolue · 4 Non résolue/Rejetée · 5 Ouverte
const STATUS_THEME = {
  1: { color: '#ef6a78', soft: '#fdecee' },
  2: { color: '#8a4fbd', soft: '#f1eaf7' },
  3: { color: '#24c38b', soft: '#e6f7f1' },
  4: { color: '#ef6a78', soft: '#fdecee' },
  5: { color: '#f5ba74', soft: '#fef4e8' },
};
const statusTheme = (id) => STATUS_THEME[id] || { color: '#b8c1c9', soft: '#eef1f3' };

function Content({ issues, eadl, statuses, issueCategories, refreshing, onRefresh }) {
  const { t } = useTranslation();

  const navigation = useNavigation();
  const [selectedId, setSelectedId] = useState(null);
  const [status, setStatus] = useState('assigned');
  const [_issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState({});
  const [__issues, set_Issues] = useState([]);

  const [pickerValue2, setPickerValue2] = useState(null);
  const [items2, setItems2] = useState(issueCategories ?? []);

  // Nombre d'issues actuellement affichées (grandit par pas de PAGE_SIZE au scroll).
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setIssues(issues);
  }, []);

  // Toute recomposition de la liste (changement d'onglet, recherche, filtre catégorie) repart
  // de la première page.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [__issues]);

  const visibleIssues = useMemo(
    () => (__issues || []).slice(0, visibleCount),
    [__issues, visibleCount],
  );
  const hasMore = visibleCount < (__issues?.length || 0);

  // Filtre "Cat" : on préfixe l'option "Toutes les catégories" (sentinelle ALL_CATEGORY) qui
  // remet le filtre catégorie à zéro.
  const ALL_CATEGORY = '__all__';
  const categoryItems = useMemo(
    () => [{ id: ALL_CATEGORY, name: t('all_categories') }, ...(issueCategories || [])],
    [issueCategories, t],
  );
  const loadMore = () => {
    if (hasMore) setVisibleCount((c) => c + PAGE_SIZE);
  };

  //Search
  const [searchPhrase, setSearchPhrase] = useState("");
  const [clicked, setClicked] = useState(false);

  const check_character = (liste, elt) => {
    let l;
    let eltUpper = elt.toUpperCase();
    for (let i = 0; i < liste.length; i++) {
      l = liste[i];
      if (l && eltUpper.includes(l)) {
        return true;
      }
    }
    return false;
  };

  // Liste COMPLÈTE des issues de l'onglet demandé, recalculée à chaque fois depuis la prop
  // `issues` (jamais depuis un sous-ensemble déjà affiché / paginé). Doit rester alignée sur les
  // définitions de `filteredIssuesCopy.*` du useEffect ci-dessous (comptes des onglets).
  const filterForTab = (list, key) => {
    const meId = eadl.representative?.id;
    const isNat = eadl.administrative_region == "1";
    switch (key) {
      case 'registe':
        return list.filter((i) => (i.reporter && i.reporter.id === meId) || isNat);
      case 'assigned':
        return list.filter((i) => i.assignee && i.assignee.id && i.assignee.id === meId);
      case 'open':
        return list.filter((i) => i?.status?.id === 2 && ((i.reporter && i.reporter.id === meId) || isNat));
      case 'resolved':
        return list.filter((i) => i?.status?.id === 3 && ((i.assignee && i.assignee.id === meId) || (i.reporter && i.reporter.id === meId) || isNat));
      case 'rejected':
        return list.filter((i) => i?.status?.id === 4 && ((i.assignee && i.assignee.id === meId) || isNat));
      default:
        return list;
    }
  };

  // Applique le filtre texte (`searchPhrase`) + le filtre catégorie (`pickerValue2`) à une
  // liste de base — factorisé pour être réutilisé aussi bien par les handlers de recherche que
  // par le `useEffect` de changement d'onglet (registe/assigned/open/resolved), afin que les
  // filtres restent appliqués quand on change d'onglet.
  const applyFilters = (baseList, phraseOverride, catOverride) => {
    let out = baseList || [];
    const phrase = ((phraseOverride ?? searchPhrase) || '').toUpperCase().trim();
    if (phrase) {
      const parts = [phrase];
      out = out.filter((elt) => (
        (elt && elt.tracking_code && check_character(parts, elt.tracking_code)) ||
        (elt && elt.internal_code && check_character(parts, elt.internal_code)) ||
        (elt && elt.description && check_character(parts, elt.description)) ||
        (elt && elt.category && elt.category.name && check_character(parts, elt.category.name)) ||
        (elt && elt.category && elt.category.id && check_character(parts, String(elt.category.id))) ||
        (elt && elt.administrative_region && elt.administrative_region.name && check_character(parts, elt.administrative_region.name))
      ));
    }
    const catId = catOverride === undefined
      ? (pickerValue2 && pickerValue2 !== ALL_CATEGORY ? pickerValue2 : null)
      : catOverride;
    if (catId != null && catId !== ALL_CATEGORY) {
      out = out.filter((issue) => issue && issue.category && issue.category.id === catId);
    }
    return out;
  };

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

    filteredIssuesCopy.open = issues.filter(
      (issue) => (issue?.status?.id === 2 &&
        ((issue.reporter && issue.reporter.id === eadl.representative?.id) || eadl.administrative_region == "1")
      )
    );

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

    // Liste complète de l'onglet courant, recalculée depuis `issues` (source unique).
    const selectedTabIssues = filterForTab(issues, status);
    setIssues(selectedTabIssues);
    // Applique la recherche texte + le filtre catégorie actifs au nouvel onglet.
    set_Issues(applyFilters(selectedTabIssues));
  }, [status, issues, statuses, eadl.representative?.id]);

  const daysOpen = (item) => {
    const raw = item.created_date;
    if (!raw) return null;
    const start = raw instanceof Date ? raw.getTime() : new Date(raw).getTime();
    if (Number.isNaN(start)) return null;
    return Math.max(0, Math.floor((Date.now() - start) / 86400000));
  };

  function Item({ item, onPress }) {
    const theme = statusTheme(item.status?.id);
    const d = daysOpen(item);
    const daysStyle =
      d == null ? null : d <= 7 ? styles.daysFresh : d <= 30 ? styles.daysWarn : styles.daysLate;
    const locality = item.administrative_region?.name;
    const reportedByMe = item.reporter?.id && item.reporter.id === eadl.representative?.id;

    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.card}>
        <View style={[styles.cardAccent, { backgroundColor: theme.color }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <Text style={styles.category} numberOfLines={1}>
              {item.category?.name || t('issues')}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: theme.soft }]}>
              <View style={[styles.statusDot, { backgroundColor: theme.color }]} />
              <Text style={[styles.statusBadgeText, { color: theme.color }]} numberOfLines={1}>
                {item.status?.name || '—'}
              </Text>
            </View>
          </View>

          {item.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          <View style={styles.cardFooter}>
            <View style={styles.metaChip}>
              <MaterialCommunityIcons name="pound" size={13} color="#8a97a3" />
              <Text style={styles.metaChipText} numberOfLines={1}>
                {item.tracking_code || item.internal_code || '—'}
              </Text>
            </View>

            {locality ? (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="map-marker-outline" size={13} color="#8a97a3" />
                <Text style={styles.metaText} numberOfLines={1}>{locality}</Text>
              </View>
            ) : null}

            {d != null ? (
              <View style={[styles.daysPill, daysStyle]}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={12}
                  color={StyleSheet.flatten(daysStyle)?.color || '#8a97a3'}
                />
                <Text style={[styles.daysText, { color: StyleSheet.flatten(daysStyle)?.color }]}>
                  {d} j
                </Text>
              </View>
            ) : null}

            <View style={{ flex: 1 }} />
            <MaterialCommunityIcons name="chevron-right" size={22} color="#c4ccd3" />
          </View>

          {reportedByMe ? (
            <Text style={styles.reportedBy}>{t('reported_by')}: {t('me')}</Text>
          ) : item.reporter?.name ? (
            <Text style={styles.reportedBy}>{t('reported_by')}: {item.reporter.name}</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  }

  const renderItem = ({ item }) => (
    <Item
      key={`${item._id}_${item.id}`}
      item={item}
      onPress={() =>
        navigation.navigate('IssueDetailTabs', {
          item,
          merge: true,
        })
      }
    />
  );

  const TABS = [
    { key: 'registe', label: t('initial_status') },
    { key: 'assigned', label: t('assigned') },
    { key: 'open', label: t('open') },
    { key: 'resolved', label: t('resolved') },
  ];

  const tabCount = (key) => {
    if (key === 'resolved') return filteredIssues?.all_resolved?.length || 0;
    return filteredIssues?.[key]?.length || 0;
  };

  const renderHeader = () => (
    <View style={styles.headerWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
      >
        {TABS.map((tab) => {
          const active = status === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.8}
              onPress={() => setStatus(tab.key)}
              style={[styles.tabChip, active && styles.tabChipActive]}
            >
              <Text style={[styles.tabChipText, active && styles.tabChipTextActive]}>
                {tab.label}
              </Text>
              <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>
                  {tabCount(tab.key)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.filtersBlock}>
        <View style={styles.filterFullRow}>
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
        <View style={styles.filterFullRow}>
          <CustomDropDownPickerWithRender
            schema={{
              label: 'name',
              value: 'id',
              id: 'id',
              confidentiality_level: 'confidentiality_level',
              assigned_department: 'assigned_department',
            }}
            placeholder={t('category_filter')}
            value={pickerValue2}
            items={categoryItems}
            setPickerValue={setPickerValue2}
            setItems={setItems2}
            onSelectItem={onSearchIssuesByCategory}
            zIndex={5}
            customDropdownWrapperStyle={{
              marginTop: 0,
              marginBottom: 0,
              marginHorizontal: 0,
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          />
        </View>
      </View>

      <View style={styles.listTitleRow}>
        <Text style={styles.listTitle}>{t('issues')}</Text>
        <Text style={styles.listCount}>{__issues?.length || 0}</Text>
      </View>
    </View>
  );

  // Recherche texte : filtre TOUTE la liste de l'onglet courant (recalculée depuis `issues`),
  // pas seulement les issues déjà affichées, en conservant le filtre catégorie.
  const onChangeSearchFunction = async (searchPhraseCopy = searchPhrase) => {
    const result = applyFilters(filterForTab(issues, status), searchPhraseCopy);
    set_Issues(result);
    return result;
  };

  // Filtre catégorie : idem, sur toute la liste de l'onglet, en conservant la recherche texte.
  // `pickerValue2` n'est pas encore à jour au moment de `onSelectItem` -> on passe l'id explicite.
  const onSearchIssuesByCategory = async (category) => {
    const catId = (!category || category.id === ALL_CATEGORY) ? null : category.id;
    set_Issues(applyFilters(filterForTab(issues, status), undefined, catId));
  };
  //End Search

  return (
    <View style={styles.screen}>
      {/* En-tête FIXE : onglets + recherche + titre. Sorti de `ListHeaderComponent` pour qu'il
          ne défile plus avec la liste. */}
      <View style={styles.stickyHeader}>{renderHeader()}</View>

      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={visibleIssues}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="folder-open-outline" size={40} color="#d3dae0" />
            <Text style={styles.emptyText}>{t('issues')}: 0</Text>
          </View>
        }
        ListFooterComponent={
          hasMore ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
        keyExtractor={(item) => `${item.id}_${item._id}`}
        extraData={`${selectedId}_${visibleCount}`}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} /> : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f4f6f7',
  },
  stickyHeader: {
    // Au-dessus de la liste pour que la carte "catégorie" et l'ombre débordent par-dessus.
    zIndex: 20,
    elevation: 6,
    backgroundColor: '#f4f6f7',
  },
  list: {
    flex: 1,
    backgroundColor: '#f4f6f7',
  },
  listContent: {
    paddingBottom: 28,
  },
  footerLoading: {
    paddingVertical: 18,
    alignItems: 'center',
  },

  // ---- Header (tabs + search) ----
  headerWrap: {
    backgroundColor: '#ffffff',
    paddingTop: 10,
    paddingBottom: 4,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tabsRow: {
    paddingHorizontal: 14,
    gap: 8,
    alignItems: 'center',
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#f1f4f5',
    marginRight: 8,
  },
  tabChipActive: {
    backgroundColor: colors.primary,
  },
  tabChipText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12.5,
    color: '#6b7681',
  },
  tabChipTextActive: {
    color: '#ffffff',
  },
  tabBadge: {
    marginLeft: 7,
    minWidth: 20,
    paddingHorizontal: 5,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  tabBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10.5,
    color: '#8a97a3',
  },
  tabBadgeTextActive: {
    color: '#ffffff',
  },
  filtersBlock: {
    paddingHorizontal: 14,
    marginTop: 10,
  },
  filterFullRow: {
    width: '100%',
    marginBottom: 8,
  },
  listTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginTop: 2,
  },
  listTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#2f3a45',
  },
  listCount: {
    marginLeft: 8,
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    color: colors.primary,
    backgroundColor: 'rgba(36,195,139,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 999,
    overflow: 'hidden',
  },

  // ---- Issue card ----
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 14,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#1f2d3d',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  cardAccent: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  category: {
    flex: 1,
    marginRight: 10,
    fontFamily: 'Poppins_500Medium',
    fontSize: 13.5,
    color: '#2f3a45',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 999,
    maxWidth: 150,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10.5,
  },
  description: {
    marginTop: 6,
    fontFamily: 'Poppins_300Light',
    fontSize: 12.5,
    lineHeight: 17,
    color: '#66717c',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 11,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f5f6',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 7,
    maxWidth: 130,
  },
  metaChipText: {
    marginLeft: 3,
    fontFamily: 'Poppins_500Medium',
    fontSize: 10.5,
    color: '#6b7681',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    maxWidth: 120,
  },
  metaText: {
    marginLeft: 3,
    fontFamily: 'Poppins_300Light',
    fontSize: 11,
    color: '#8a97a3',
  },
  daysPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 7,
  },
  daysText: {
    marginLeft: 3,
    fontFamily: 'Poppins_700Bold',
    fontSize: 10.5,
  },
  daysFresh: { backgroundColor: 'rgba(36,195,139,0.14)', color: '#1a9c6e' },
  daysWarn: { backgroundColor: 'rgba(245,186,116,0.20)', color: '#b9740f' },
  daysLate: { backgroundColor: 'rgba(239,106,120,0.16)', color: '#d64550' },
  reportedBy: {
    marginTop: 9,
    fontFamily: 'Poppins_300Light',
    fontSize: 11,
    color: '#9aa5af',
  },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 10,
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: '#9aa5af',
  },
});

export default Content;

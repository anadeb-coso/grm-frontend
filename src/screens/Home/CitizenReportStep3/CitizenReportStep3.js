import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Content from './containers/Content';
import { styles } from './CitizenReportStep3.styles';
import { getUserDocs } from '../../../utils/databaseManager';
import { setCommune, setDocument } from '../../../store/ducks/userDocument.duck';
import { database } from '../../../database';

function CitizenReportStep3({ route }) {
  const { params } = route;
  const customStyles = styles();
  const dispatch = useDispatch();

  const { userDocument: eadl } = useSelector((state) => state.get('userDocument').toObject());

  // Référentiels nécessaires pour permettre la modification, sur cet écran de récapitulatif, des
  // champs saisis aux étapes précédentes (catégorie, type, tranche d'âge, groupes de citoyens) —
  // même requêtes que les écrans d'origine (CitizenReportStep2.js, CitizenReportContactInfo.js).
  const [issueCategories, setIssueCategories] = useState();
  const [issueTypes, setIssueTypes] = useState();
  const [issueAges, setIssueAges] = useState();
  const [citizenGroupsI, setCitizenGroupsI] = useState();
  const [citizenGroupsII, setCitizenGroupsII] = useState();

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
  }, [dispatch, eadl]);

  useEffect(() => {
    database.get('issue_categories').query().fetch()
      .then((records) => {
        setIssueCategories(
          records
            .map((c) => ({
              id: c.legacyId,
              name: c.name,
              label: c.label,
              abbreviation: c.abbreviation,
              confidentiality_level: c.confidentialityLevel,
              assigned_department: c.assignedDepartment,
            }))
            .filter((obj) => !([4, 7].includes(obj.id)))
        );
      })
      .catch((err) => console.log(err));

    database.get('issue_types').query().fetch()
      .then((records) => setIssueTypes(records.map((t) => ({ id: t.legacyId, name: t.name }))))
      .catch((err) => console.log(err));

    database.get('issue_age_groups').query().fetch()
      .then((records) => setIssueAges(records.map((r) => ({ id: r.legacyId, name: r.name }))))
      .catch((err) => console.log(err));

    database.get('issue_citizen_groups_1').query().fetch()
      .then((records) => setCitizenGroupsI(records.map((r) => ({ id: r.legacyId, name: r.name }))))
      .catch((err) => console.log(err));

    database.get('issue_citizen_groups_2').query().fetch()
      .then((records) => setCitizenGroupsII(records.map((r) => ({ id: r.legacyId, name: r.name }))))
      .catch((err) => console.log(err));
  }, []);

  return (
    <SafeAreaView style={customStyles.container}>
      <Content
        eadl={eadl}
        issue={{
          ...params.stepOneParams,
          ...params.stepTwoParams,
          ...params.stepLocationParams,
        }}
        issueCategories={issueCategories}
        issueTypes={issueTypes}
        issueAges={issueAges}
        citizenGroupsI={citizenGroupsI}
        citizenGroupsII={citizenGroupsII}
      />
    </SafeAreaView>
  );
}

export default CitizenReportStep3;

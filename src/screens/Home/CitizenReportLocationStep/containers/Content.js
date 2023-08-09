import { useNavigation } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  TextInput as NativeTextInput,
  Platform,
  ScrollView,
  Text,
  View,
  Image,
  RefreshControl
} from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { colors } from '../../../../utils/colors';
import { styles } from './Content.styles';
import CustomDropDownPickerWithRender from '../../../../components/CustomDropDownPicker/CustomDropDownPicker';
import DropDownPicker from 'react-native-dropdown-picker';

const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: 'white',
    placeholder: '#dedede',
    text: '#707070',
  },
};

export function Content({ stepOneParams, stepTwoParams, uniqueRegion, cantons, villages }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  //   const [communes, setCommunes] = useState(issueCommunes);
  //   const [commune1, setCommune1] = useState(null);
  //   const [location, setLocation] = useState();
  //   const [pickersState, setPickersState] = useState([]);
  const [additionalDetails, setAdditionalDetails] = useState(null);
  //   const [initialized, setInitialized] = useState(false);
  //   const [communesPickers, setCommunesPickers] = useState([]);
  const [canton, setCanton] = useState(null);
  const [cantonsItems, setCantonsItems] = useState(cantons ?? []);
  const [selectedCanton, setSelectedselectedCanton] = useState(null);
  const [village, setVillage] = useState(null);
  const [villagesItems, setVillagesItems] = useState([]);
  const [selectedVillage, setSelectedselectedVillage] = useState(null);
  const [hideCantonField, setHideCantonField] = useState(true);
  const [hideVillageField, setHideVillageField] = useState(true);
  const [open, setOpen] = useState(false);
  const [openVillage, setOpenVillage] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [structureName, setStructureName] = useState('');
  const [structurePhone, setStructurePhone] = useState('');
  const [structureEmail, setStructureEmail] = useState('');
  const [structureNameMethodError, setStructureNameMethodError] = React.useState();
  const [structurePhoneMethodError, setStructurePhoneMethodError] = React.useState();
  const [structureEmailMethodError, setStructureEmaileMethodError] = React.useState();
  const [validationEmail, setValidationEmail] = useState(true);
  

  

  const setAdministrativeLevel = () => {
    let d = [];
    if(cantons.length == 0 && villages.length == 0){
      setHideCantonField(true);
      setHideVillageField(true);
    }else if([0, 1].includes(cantons.length)){
      setHideCantonField(true);
      setVillagesInfos(true, canton);
    }else{
      setHideCantonField(false);
      setVillagesInfos(false, canton);
      for(let i=0; i<cantons.length; i++){
        d.push({name: String(cantons[i].name), id: String(cantons[i].id)});
        if(i+1==cantons.length){
          setCantonsItems(d);
        }
      }
    }
  }
  useEffect(() => {
    setAdministrativeLevel();
    // setVillagesInfos(hideCantonField, canton);
   
  }, []);
  const onRefresh = () => {
    setRefreshing(true);
    setAdministrativeLevel();
    setRefreshing(false);
  };

  const setVillagesInfos = (hideC, c) => {
    let v = [];
    if([0, 1].includes(villages.length) || (hideC == false && c == null)){
      setHideVillageField(true);
      if(villages.length == 1){
        setVillage(villages[0]);
        setSelectedselectedVillage(villages[0]);
      }
    }else{
      for(let i=0; i<villages.length; i++){
        if(c != null && c.id == villages[i].parent){
          v.push({name: String(villages[i].name), id: String(villages[i].id)});
        }else if(c  == null){
          v.push({name: String(villages[i].name), id: String(villages[i].id)});
        }
        if(i+1==villages.length){
          setVillagesItems(v);
        }
      }
      setHideVillageField(false);
    }
  }

  const validate_email = (text) => {
    let reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/;
    if (text && reg.test(text) === false) {
      setValidationEmail(false);
      setStructureEmail(text);
      return false;
    }
    else {
      setValidationEmail(true);
      setStructureEmail(text);
    }
  }
  
  
  //   useEffect(() => {
  //     if (issueCommunes && !initialized) {
  //       setInitialized(true);
  //       setCommunes(issueCommunes);
  //     }
  //   }, [issueCommunes]);

  //   useEffect(() => {}, [pickersState]);

  //   const handler = (selectedAdministrativeId, _index) => {
  //     let communesCopy = communes.slice();
  //     let updatedPickers = [];
  //     let index;
  //     if (_index !== undefined) index = _index + 1;

  //     // Filter communes by parent (administrative ID)
  //     communesCopy = communesCopy.filter((x) => x.parent_id === selectedAdministrativeId);

  //     if (communesCopy.length > 0) {
  //       if (communesPickers[index]) {
  //         // If picker exist at position -> Replace picker content
  //         updatedPickers = [...communesPickers];
  //         updatedPickers[index] = selectedAdministrativeId;
  //       } else {
  //         // Otherwise -> Add new picker
  //         updatedPickers = [...communesPickers, selectedAdministrativeId];
  //       }
  //       setCommunesPickers(updatedPickers);
  //     } else {
  //       // Remove next pickers/selected values and stop
  //       updatedPickers = [...communesPickers];
  //       if (index === undefined) {
  //         updatedPickers = [];
  //         setPickersState([]);
  //       } else {
  //         updatedPickers.splice(index, communesPickers.length - index);
  //       }
  //       setCommunesPickers(updatedPickers);
  //     }
  //   };

  //   const handlePickCommune = useCallback(debounce(handler, 100), [
  //     communesPickers,
  //     communes,
  //     pickersState,
  //   ]);

  //   const filterCommunes = (parent) => {
  //     let _communes = communes.slice();
  //     _communes = _communes.filter((commune) => commune.parent_id === parent);

  //     return _communes;
  //   };
  return (
    <ScrollView refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
    }>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null}>
        <View style={{ padding: 23 }}>
          <Text style={styles.stepText}>{t('step_4')}</Text>
          <Text style={styles.stepDescription}>{t('step_location_description')}</Text>
          <Text style={styles.stepNote}>{t('step_location_body')}</Text>
        </View>

        {/* {!uniqueRegion && communes && (
          <CustomDropDownPicker
            schema={{
              label: 'name',
              value: 'administrative_id',
            }}
            placeholder={t('step_location_dropdown_placeholder')}
            value={commune1}
            disabled={!!uniqueRegion}
            items={filterCommunes(null)}
            setPickerValue={(val) => {
              setCommune1(val());
              if (val() && val() !== commune1) handlePickCommune(val());
            }}
            onSelectItem={(item) => setLocation(item)}
            // onChangeValue={(value) => {
            //   if (value) handlePickCommune(value);
            // }}
          />
        )} */}
        {/* {communesPickers.map((parent, index) => (
          <View style={{ zIndex: 1000 + index }}>
            <CustomDropDownPicker
              schema={{
                label: 'name',
                value: 'administrative_id',
              }}
              disabled={!!uniqueRegion}
              placeholder={t('step_location_dropdown_placeholder')}
              value={pickersState[index]}
              items={filterCommunes(parent, index)}
              onSelectItem={(item) => setLocation(item)}
              setPickerValue={(val) => {
                const newState = [...pickersState];
                newState.splice(index, newState.length - index);
                newState[index] = val();
                setPickersState(newState);
                if (val) {
                  handlePickCommune(val(), index);
                }
              }}
            />
          </View>
        ))} */}

        {/* {cantons && (
          <CustomDropDownPicker
            schema={{
              label: 'name',
              value: 'administrative_id',
            }}
            placeholder={t('step_location_dropdown_placeholder')}
            value={canton}
            // disabled={!!uniqueRegion}
            items={cantons}
            setPickerValue={setCanton}
            // setItems={setCantons}
          />
        )} */}
        {!hideCantonField && (<View style={{ zIndex: 2000 }}>
          <CustomDropDownPickerWithRender
            schema={{
              label: 'name',
              value: 'id',
            }}
            placeholder={t('step_location_dropdown_placeholder')}
            value={canton}
            setValue={setCanton}
            items={cantonsItems}
            setPickerValue={setCanton}
            setItems={setCantonsItems}
            onSelectItem={(item) => {
              setVillagesInfos(hideCantonField, item);
              setSelectedselectedCanton(item);
            }}
            open={open}
            setOpen={setOpen}
          />
        </View> )}

        {!hideVillageField && (<View style={{ zIndex: 2000 }}>
          <CustomDropDownPickerWithRender
            schema={{
              label: 'name',
              value: 'id',
            }}
            placeholder={t('step_location_dropdown_placeholder')}
            value={village}
            setValue={setVillage}
            items={villagesItems}
            setPickerValue={setVillage}
            setItems={setVillagesItems}
            onSelectItem={(item) => setSelectedselectedVillage(item)}
            open={openVillage}
            setOpen={setOpenVillage}
          />
        </View> )}

        {selectedVillage && (<View style={{ paddingHorizontal: 50, flexDirection: 'row', marginBottom: 15 }} >
          <Image source={require("../../../../../assets/location_icon.png")} 
          style={{
            resizeMode: 'contain',
            width: 50,
            height: 50,
            flex: 1
          }}/>
          <Text style={{...styles.stepDescription, flex: 4, marginTop: 15}}>{selectedVillage.name}</Text>
        </View> )}

        


        <View style={{ paddingHorizontal: 50 }}>
          <Text style={styles.stepNote}>{t('step_location_input_explanation')}</Text>
          <TextInput
            multiline
            numberOfLines={4}
            style={[
              styles.grmInput,
              {
                height: 100,
                justifyContent: 'flex-start',
                textAlignVertical: 'top',
              },
            ]}
            placeholder={t('step_2_placeholder_4')}
            outlineColor="#3e4000"
            placeholderTextColor="#5f6800"
            theme={theme}
            mode="outlined"
            value={additionalDetails}
            onChangeText={(text) => setAdditionalDetails(text)}
            render={(innerProps) => (
              <NativeTextInput
                {...innerProps}
                style={[
                  innerProps.style,
                  {
                    paddingTop: 8,
                    paddingBottom: 8,
                    height: 100,
                  },
                ]}
              />
            )}
          />

          <Text />
          <TextInput
              style={styles.grmInput}
              placeholder={t('step_2_structure_in_charge_name')}
              outlineColor="#3e4000"
              placeholderTextColor="#5f6800"
              theme={theme}
              mode="outlined"
              value={structureName}
              error={structureNameMethodError}
              onChangeText={(text) => {
                setStructureName(text);
              }}
            />
            <Text />
            <TextInput
              style={styles.grmInput}
              placeholder={t('step_2_structure_in_charge_phone')}
              outlineColor="#3e4000"
              placeholderTextColor="#5f6800"
              theme={theme}
              mode="outlined"
              value={structurePhone}
              error={structurePhoneMethodError}
              onChangeText={(text) => {
                setStructurePhone(text);
              }}
            />
            <Text />
            <TextInput
              style={styles.grmInput}
              placeholder={t('step_2_structure_in_charge_email')}
              outlineColor="#3e4000"
              placeholderTextColor="#5f6800"
              theme={theme}
              mode="outlined"
              value={structureEmail}
              error={structureEmailMethodError}
              onChangeText={(text) => validate_email(text)}
            />
           {!validationEmail ? <Text style={{ color: 'red'}}>{t('step_2_validation_email')}</Text> : <></>}
            <Text />
        </View>





        <View style={{ paddingHorizontal: 50 }}>
          <Button
            theme={theme}
            disabled={!uniqueRegion || !additionalDetails || (!selectedVillage && villages.length != 0) || !validationEmail} // || (!hideVillageField && !village) || (!hideCantonField && !canton)
            style={{ alignSelf: 'center', margin: 24 }}
            labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
            mode="contained"
            onPress={() => {
              navigation.navigate('CitizenReportStep3', {
                stepOneParams,
                stepTwoParams,
                stepLocationParams: {
                  // issueLocation: {
                  //   administrative_id: uniqueRegion?.administrative_id,
                  //   name: uniqueRegion?.name,
                  // },
                  issueLocation: {
                    administrative_id: selectedVillage?.id,
                    name: selectedVillage?.name,
                  },
                  locationDescription: additionalDetails,
                  structure_in_charge: {
                    name: structureName ?? '',
                    phone: structurePhone ?? '',
                    email: structureEmail ?? '',
                  },
                },
              });
            }}
          >
            {t('next')}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

export default Content;

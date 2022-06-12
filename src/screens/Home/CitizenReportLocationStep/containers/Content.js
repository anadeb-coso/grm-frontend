import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  Platform,
  KeyboardAvoidingView,
  TextInput as NativeTextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button, TextInput } from 'react-native-paper';
import { debounce } from 'lodash';
import i18n from 'i18n-js';
import { styles } from './Content.styles';
import { colors } from '../../../../utils/colors';
import CustomDropDownPicker from '../../../../components/CustomDropDownPicker/CustomDropDownPicker';

const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: 'white',
    placeholder: '#dedede',
    text: '#707070',
  },
};

export function Content({ stepOneParams, stepTwoParams, issueCommunes, uniqueRegion }) {
  const navigation = useNavigation();
  const [communes, setCommunes] = useState(issueCommunes);
  const [commune1, setCommune1] = useState(null);
  const [location, setLocation] = useState();
  const [pickersState, setPickersState] = useState([]);
  const [additionalDetails, setAdditionalDetails] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [communesPickers, setCommunesPickers] = useState([]);

  useEffect(() => {
    if (issueCommunes && !initialized) {
      setInitialized(true);
      setCommunes(issueCommunes);
    }
  }, [issueCommunes]);

  useEffect(() => {}, [pickersState]);

  const handler = (selectedAdministrativeId, _index) => {
    let communesCopy = communes.slice();
    let updatedPickers = [];
    let index;
    if (_index !== undefined) index = _index + 1;

    // Filter communes by parent (administrative ID)
    communesCopy = communesCopy.filter((x) => x.parent_id === selectedAdministrativeId);

    if (communesCopy.length > 0) {
      if (communesPickers[index]) {
        // If picker exist at position -> Replace picker content
        updatedPickers = [...communesPickers];
        updatedPickers[index] = selectedAdministrativeId;
      } else {
        // Otherwise -> Add new picker
        updatedPickers = [...communesPickers, selectedAdministrativeId];
      }
      setCommunesPickers(updatedPickers);
    } else {
      // Remove next pickers/selected values and stop
      updatedPickers = [...communesPickers];
      if (index === undefined) {
        updatedPickers = [];
        setPickersState([]);
      } else {
        updatedPickers.splice(index, communesPickers.length - index);
      }
      setCommunesPickers(updatedPickers);
    }
  };

  const handlePickCommune = useCallback(debounce(handler, 100), [
    communesPickers,
    communes,
    pickersState,
  ]);

  const filterCommunes = (parent) => {
    let _communes = communes.slice();
    _communes = _communes.filter((commune) => commune.parent_id === parent);

    return _communes;
  };
  return (
    <ScrollView>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null}>
        <View style={{ padding: 23 }}>
          <Text style={styles.stepText}>{i18n.t('step_4')}</Text>
          <Text style={styles.stepDescription}>{i18n.t('step_location_description')}</Text>
          <Text style={styles.stepNote}>{i18n.t('step_location_body')}</Text>
        </View>

        {!uniqueRegion && communes && (
          <CustomDropDownPicker
            schema={{
              label: 'name',
              value: 'administrative_id',
            }}
            placeholder={i18n.t('step_location_dropdown_placeholder')}
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
        )}
        {communesPickers.map((parent, index) => (
          <View style={{ zIndex: 1000 + index }}>
            <CustomDropDownPicker
              schema={{
                label: 'name',
                value: 'administrative_id',
              }}
              disabled={!!uniqueRegion}
              placeholder={i18n.t('step_location_dropdown_placeholder')}
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
        ))}
        <View style={{ paddingHorizontal: 50 }}>
          <Text style={styles.stepNote}>{i18n.t('step_location_input_explanation')}</Text>
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
            placeholder={i18n.t('step_2_placeholder_4')}
            outlineColor="#f6f6f6"
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
        </View>

        <View style={{ paddingHorizontal: 50 }}>
          <Button
            theme={theme}
            disabled={
              (commune1 === null || [commune1, ...pickersState].length === 0) && !uniqueRegion
            }
            style={{ alignSelf: 'center', margin: 24 }}
            labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
            mode="contained"
            onPress={() => {
              navigation.navigate('CitizenReportStep3', {
                stepOneParams,
                stepTwoParams,
                stepLocationParams: {
                  issueLocation: {
                    administrative_id:
                      uniqueRegion?.administrative_id ?? location?.administrative_id,
                    name: uniqueRegion?.name ?? location?.name,
                  },
                  locationDescription: additionalDetails,
                },
              });
            }}
          >
            {i18n.t('next')}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

export default Content;

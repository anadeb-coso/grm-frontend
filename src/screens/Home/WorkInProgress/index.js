import React from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, Text } from 'react-native';
import { Button } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { logout } from '../../../store/ducks/authentication.duck';
import LanguageSelector from '../../../translations/LanguageComponent';

export function WorkInProgress() {
  const { t } = useTranslation();

  const dispatch = useDispatch();
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', margin: 20 }}>
      <LanguageSelector />
      <Text>Work in Progress </Text>
      <Button color="#24c38b" onPress={() => dispatch(logout())}>
        {t('logout')}
      </Button>
    </SafeAreaView>
  );
}

export default WorkInProgress;

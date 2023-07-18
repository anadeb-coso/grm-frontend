import React from 'react';
import { Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';

function Datas() {
  const { t } = useTranslation();
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ justifyContent: 'center', alignItems: 'center', padding: 20 }}
    >
      <Text>
      {t('sync_datas_text')}
      </Text>
    </ScrollView>
  );
}

export default React.memo(Datas);

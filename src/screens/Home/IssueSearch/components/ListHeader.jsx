import * as PropTypes from 'prop-types';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

export default function ListHeader(props) {
  const { t } = useTranslation();
  console.log({ props });
  return (
    <View>
      <View
        style={{
          borderRadius: 10,
          backgroundColor: '#ffffff',
          shadowColor: 'rgba(0, 0, 0, 0.05)',
          shadowOffset: {
            width: 0,
            height: 3,
          },
          shadowRadius: 15,
          shadowOpacity: 1,
          margin: 17,
          padding: 10,
        }}
      >
        {/* <Text
          style={{
            fontFamily: 'Poppins_700Bold',
            fontSize: 14,
            fontWeight: 'bold',
            fontStyle: 'normal',
            letterSpacing: 0,
            textAlign: 'left',
            color: '#707070',
          }}
        >
          {t('overdue_label')}:{' '}
          {props.overdue ? <Text style={{ color: '#ef6a78' }}>{props.overdue}</Text> : '--'}
        </Text> */}
        {/* <Text style={styles.statisticsText}>
          {t('assigned_to_you_label')}: {props.length}
        </Text> */}

        <Text style={styles.statisticsText}>
          {t('registe_to_you_label')}: {props.registe}
        </Text>
        <Text style={styles.statisticsText}>
          {t('assigned_to_you_label')}: {props.assigned}
        </Text>
        <Text style={styles.statisticsText}>
          {t('open_to_you_label')}: {props.open}
        </Text>
        <Text style={styles.statisticsText}>
          {t('resolved_by_you_label')}:{' '}
          {props.resolved ? <Text style>{props.resolved}</Text> : '--'}
        </Text>
        <Text style={styles.statisticsText}>
          {t('your_complaints_resolved_to_you_label')}:{' '}
          {props.yourResolution ? <Text style>{props.yourResolution}</Text> : '--'}
        </Text>
        {/* <Text style={styles.statisticsText}>
          {t('reject_to_you_label')}:{' '}
          {props.rejected ? <Text style>{props.rejected}</Text> : '--'}
        </Text>
        <Text style={styles.statisticsText}>
          {t('your_complaints_reject_to_you_label')}:{' '}
          {props.YourRejecte ? <Text style>{props.YourRejecte}</Text> : '--'}
        </Text> */}


        {/* <Text style={styles.statisticsText}>
          {t('average_days_label')}: {props.average ? <Text style>{props.average}</Text> : '--'}
        </Text>
        <Text style={styles.statisticsText}>
          {t('average_satisfaction_label')}:{' '}
          {props.average ? <Text style>issues.average</Text> : '--'}
        </Text> */}
      </View>
      <View style={{ padding: 15 }}>
        <Text
          style={{
            fontSize: 17,
            fontWeight: 'bold',
            fontStyle: 'normal',
            lineHeight: 18,
            letterSpacing: 0,
            textAlign: 'left',
            color: '#707070',
          }}
        >
          {t('issues')}:
        </Text>
      </View>
    </View>
  );
}

ListHeader.propTypes = {
  overdue: PropTypes.any,
  length: PropTypes.any,
  average: PropTypes.any,
};

const styles = StyleSheet.create({
  statisticsText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    fontWeight: 'bold',
    fontStyle: 'normal',
    letterSpacing: 0,
    textAlign: 'left',
    color: '#707070',
  },
});

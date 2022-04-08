import { StyleSheet, Text, View } from 'react-native';
import i18n from 'i18n-js';
import * as PropTypes from 'prop-types';
import React from 'react';

export default function ListHeader(props) {
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
          margin: 23,
          padding: 15,
        }}
      >
        <Text
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
          {i18n.t('overdue_label')}:{' '}
          {props.overdue ? <Text style={{ color: '#ef6a78' }}>{props.overdue}</Text> : '--'}
        </Text>
        <Text style={styles.statisticsText}>
          {i18n.t('assigned_to_you_label')}: {props.length}
        </Text>
        <Text style={styles.statisticsText}>
          {i18n.t('resolved_by_you_label')}:{' '}
          {props.average ? <Text style>issues.average</Text> : '--'}
        </Text>
        <Text style={styles.statisticsText}>
          {i18n.t('average_days_label')}: {props.average ? <Text style>issues.average</Text> : '--'}
        </Text>
        <Text style={styles.statisticsText}>
          {i18n.t('average_satisfaction_label')}:{' '}
          {props.average ? <Text style>issues.average</Text> : '--'}
        </Text>
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
          {i18n.t('your_issues_label')}:
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

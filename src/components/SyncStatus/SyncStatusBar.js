import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSyncStatus } from './SyncStatusContext';

const statusColors = {
  active: 'green',
  change: 'green',
  complete: 'green',
  paused: 'orange',
  denied: 'red',
  error: 'red',
};

const SyncStatusBar = () => {
  const { syncStatuses } = useSyncStatus();

  return (
    <View style={styles.container}>
      {Object.entries(syncStatuses).map(([label, { status }]) => (
        <View key={label} style={styles.statusItem}>
          <MaterialIcons name="sync" size={18} color={statusColors[status] || 'gray'} />
          <Text style={styles.label}>{label}</Text>
          <Text style={[styles.status, { color: statusColors[status] || 'gray' }]}>
            {status}
          </Text>
        </View>
      ))}
    </View>
  );
};

export default SyncStatusBar;

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#f1f1f1',
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  label: {
    marginLeft: 5,
    fontWeight: 'bold',
    flex: 1,
  },
  status: {
    fontStyle: 'italic',
  },
});

import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ProgressBar } from 'react-native-paper';
import { subscribeSyncStatus } from '../../database/watermelonSyncManager';
import { colors } from '../../utils/colors';

// Remplace l'ancien toast "Synchronisation en cours..." (src/database/watermelonSyncManager.js) :
// une fine barre de progression indéterminée, fixée en haut de l'écran, visible sur n'importe quel
// écran de l'app tant qu'une synchronisation est en cours — montée une seule fois à la racine
// (cf. App.js) plutôt que par écran, pour rester visible même pendant la navigation.
function SyncProgressBar() {
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => subscribeSyncStatus(setIsSyncing), []);

  if (!isSyncing) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <ProgressBar indeterminate color={colors.primary} style={styles.bar} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  bar: {
    height: 3,
  },
});

export default SyncProgressBar;

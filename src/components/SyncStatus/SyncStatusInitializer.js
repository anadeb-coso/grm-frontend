import { useEffect } from 'react';
import { useSyncStatus } from './SyncStatusContext';
import { setSyncStatusUpdater } from '../../utils/syncManager';

const SyncStatusInitializer = () => {
  const { updateSyncStatus } = useSyncStatus();

  useEffect(() => {
    setSyncStatusUpdater(updateSyncStatus);
    if (__DEV__ && !updateSyncStatus) {
      console.error("UpdateSyncStatus est undefined !");
    }
  }, [updateSyncStatus]);

  return null; // Pas de rendu juste une initialisation
};

export default SyncStatusInitializer;

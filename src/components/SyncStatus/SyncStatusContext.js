import React, { createContext, useContext, useState } from 'react';

const SyncStatusContext = createContext();

export const SyncStatusProvider = ({ children }) => {
  const [syncStatuses, setSyncStatuses] = useState({}); // { label: { status: 'active' | 'paused' | 'error', lastChange: Date } }

  const updateSyncStatus = (label, status) => {
    setSyncStatuses(prev => ({
      ...prev,
      [label]: {
        status,
        lastChange: new Date(),
      },
    }));
  };

  return (
    <SyncStatusContext.Provider value={{ syncStatuses, updateSyncStatus }}>
      {children}
    </SyncStatusContext.Provider>
  );
};

export const useSyncStatus = () => useContext(SyncStatusContext);

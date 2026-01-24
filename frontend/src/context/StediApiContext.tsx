import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type StediMode = 'mockup' | 'test-data' | 'real-data';

interface StediApiContextType {
  stediMode: StediMode;
  setStediMode: (mode: StediMode) => Promise<void>;
  syncWithUser: (stediMode: StediMode) => void;
}

const StediApiContext = createContext<StediApiContextType | undefined>(undefined);

export const StediApiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stediMode, setStediModeState] = useState<StediMode>('mockup');

  const syncWithUser = useCallback((mode: StediMode) => {
    setStediModeState(mode || 'mockup');
  }, []);

  const setStediMode = useCallback(async (newMode: StediMode) => {
    try {
      const response = await fetch('/api/user/stedi-mode', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stediMode: newMode }),
      });

      if (response.ok) {
        const data = await response.json();
        setStediModeState(data.stediMode);
      } else {
        console.error('Failed to update Stedi mode');
      }
    } catch (error) {
      console.error('Error updating Stedi mode:', error);
    }
  }, []);

  return (
    <StediApiContext.Provider value={{ stediMode, setStediMode, syncWithUser }}>
      {children}
    </StediApiContext.Provider>
  );
};

export const useStediApi = () => {
  const context = useContext(StediApiContext);
  if (!context) {
    throw new Error('useStediApi must be used within StediApiProvider');
  }
  return context;
};

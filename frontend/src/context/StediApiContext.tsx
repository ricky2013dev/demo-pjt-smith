import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface StediApiContextType {
  isApiEnabled: boolean;
  toggleApi: () => Promise<void>;
  setIsApiEnabled: (enabled: boolean) => void;
  syncWithUser: (stediEnabled: boolean) => void;
}

const StediApiContext = createContext<StediApiContextType | undefined>(undefined);

export const StediApiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isApiEnabled, setIsApiEnabled] = useState(false);

  const syncWithUser = useCallback((stediEnabled: boolean) => {
    setIsApiEnabled(stediEnabled);
  }, []);

  const toggleApi = useCallback(async () => {
    const newValue = !isApiEnabled;

    try {
      const response = await fetch('/api/user/stedi-toggle', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stediEnabled: newValue }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsApiEnabled(data.stediEnabled);
      } else {
        console.error('Failed to toggle Stedi API');
      }
    } catch (error) {
      console.error('Error toggling Stedi API:', error);
    }
  }, [isApiEnabled]);

  return (
    <StediApiContext.Provider value={{ isApiEnabled, toggleApi, setIsApiEnabled, syncWithUser }}>
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

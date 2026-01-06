import React, { createContext, useContext, useState, ReactNode } from 'react';

interface StediApiContextType {
  isApiEnabled: boolean;
  toggleApi: () => void;
  setIsApiEnabled: (enabled: boolean) => void;
}

const StediApiContext = createContext<StediApiContextType | undefined>(undefined);

export const StediApiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isApiEnabled, setIsApiEnabled] = useState(false);

  const toggleApi = () => {
    setIsApiEnabled(!isApiEnabled);
  };

  return (
    <StediApiContext.Provider value={{ isApiEnabled, toggleApi, setIsApiEnabled }}>
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

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

interface AppSettingsContextType {
  isAiEnabled: boolean;
  setIsAiEnabled: (enabled: boolean) => void;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export const AppSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAiEnabled, setIsAiEnabledState] = useState<boolean>(() => {
    // Check for saved setting in localStorage, otherwise default to true (enabled)
    const savedSetting = localStorage.getItem('isAiEnabled');
    return savedSetting ? JSON.parse(savedSetting) : true;
  });

  const setIsAiEnabled = (enabled: boolean) => {
    setIsAiEnabledState(enabled);
    localStorage.setItem('isAiEnabled', JSON.stringify(enabled));
  };

  const value = { isAiEnabled, setIsAiEnabled };

  return React.createElement(AppSettingsContext.Provider, { value }, children);
};

export const useAppSettings = (): AppSettingsContextType => {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
};

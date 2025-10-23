import React, { createContext, useContext, ReactNode } from 'react';

interface AppStatusContextType {
  isApiKeyConfigured: boolean;
}

const AppStatusContext = createContext<AppStatusContextType | undefined>(undefined);

export const AppStatusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // This check runs once when the app loads. It determines if the environment
  // variable has been correctly injected into the build by the hosting platform (e.g., Vercel).
  const isApiKeyConfigured = !!process.env.API_KEY;

  const value = { isApiKeyConfigured };

  return React.createElement(AppStatusContext.Provider, { value }, children);
};

export const useAppStatus = (): AppStatusContextType => {
  const context = useContext(AppStatusContext);
  if (context === undefined) {
    throw new Error('useAppStatus must be used within an AppStatusProvider');
  }
  return context;
};

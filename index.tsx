import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { I18nProvider } from './i18n';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppSettingsProvider } from './contexts/AppSettingsContext';
import { AppStatusProvider } from './contexts/AppStatusContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <AppSettingsProvider>
          <AppStatusProvider>
            <App />
          </AppStatusProvider>
        </AppSettingsProvider>
      </I18nProvider>
    </ThemeProvider>
  </React.StrictMode>
);
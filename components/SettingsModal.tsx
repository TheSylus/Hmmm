import React from 'react';
import { useTranslation } from '../i18n';
import { useTheme } from '../contexts/ThemeContext';
import { XMarkIcon, SunIcon, MoonIcon } from './Icons';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { t, language, setLanguage } = useTranslation();
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div
        className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
            <h2 id="settings-modal-title" className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label={t('settings.closeAria')}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
        </div>
        
        <div className="space-y-6">
            {/* Theme Selection */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('settings.theme.title')}</h3>
                <div className="grid grid-cols-3 gap-2 p-1 bg-gray-200 dark:bg-gray-900 rounded-lg">
                    <button onClick={() => setTheme('light')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${theme === 'light' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'}`}>
                      {t('settings.theme.light')}
                    </button>
                    <button onClick={() => setTheme('dark')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${theme === 'dark' ? 'bg-gray-700 text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'}`}>
                      {t('settings.theme.dark')}
                    </button>
                    <button onClick={() => setTheme('system')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${theme === 'system' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'}`}>
                      {t('settings.theme.system')}
                    </button>
                </div>
            </div>

            {/* Language Selection */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('settings.language.title')}</h3>
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-200 dark:bg-gray-900 rounded-lg">
                    <button onClick={() => setLanguage('en')} className={`px-4 py-2 font-semibold rounded-md transition-colors ${language === 'en' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'}`}>
                        English
                    </button>
                    <button onClick={() => setLanguage('de')} className={`px-4 py-2 font-semibold rounded-md transition-colors ${language === 'de' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'}`}>
                        Deutsch
                    </button>
                </div>
            </div>
        </div>

        <div className="mt-8 text-center">
            <button 
                onClick={onClose}
                className="w-full sm:w-auto px-10 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition-colors"
            >
                {t('settings.button.done')}
            </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

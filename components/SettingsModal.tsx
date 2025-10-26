import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/index';
import { useTheme } from '../contexts/ThemeContext';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { XMarkIcon } from './Icons';
import { ApiKeyTester } from './ApiKeyTester';

interface SettingsModalProps {
  onClose: () => void;
  onKeyUpdate: (key: string | null) => void;
}

const maskApiKey = (key: string) => {
    if (key.length <= 8) return '****';
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onKeyUpdate }) => {
  const { t, language, setLanguage } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { isAiEnabled, setIsAiEnabled, isBarcodeScannerEnabled, setIsBarcodeScannerEnabled, isOffSearchEnabled, setIsOffSearchEnabled } = useAppSettings();
  const [currentKey, setCurrentKey] = useState<string | null>(null);
  const [isEditingKey, setIsEditingKey] = useState(false);

  useEffect(() => {
    setCurrentKey(localStorage.getItem('gemini_api_key'));
  }, []);
  
  const handleKeyChange = (newKey: string) => {
      onKeyUpdate(newKey);
      setCurrentKey(newKey);
      setIsEditingKey(false);
  }
  
  const handleKeyRemove = () => {
      if(window.confirm('Are you sure you want to remove the API key? AI features will be disabled.')) {
          onKeyUpdate(null);
          setCurrentKey(null);
          setIsEditingKey(false);
      }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div
        className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-md max-h-[95vh] overflow-y-auto"
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

            <hr className="border-gray-200 dark:border-gray-700" />

            {/* Food Database Search Toggle */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('settings.offSearch.title')}</h3>
              <label htmlFor="off-search-toggle" className="flex items-center justify-between bg-gray-100 dark:bg-gray-900/50 p-3 rounded-lg cursor-pointer">
                <span className="text-sm text-gray-600 dark:text-gray-400 max-w-[75%] pr-2">{t('settings.offSearch.description')}</span>
                <div className="relative">
                  <input
                    id="off-search-toggle"
                    type="checkbox"
                    className="sr-only peer"
                    checked={isOffSearchEnabled}
                    onChange={() => setIsOffSearchEnabled(!isOffSearchEnabled)}
                  />
                  <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-indigo-600"></div>
                </div>
              </label>
            </div>
            
            {/* Barcode Scanner Toggle */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('settings.barcodeScanner.title')}</h3>
              <label htmlFor="barcode-toggle" className="flex items-center justify-between bg-gray-100 dark:bg-gray-900/50 p-3 rounded-lg cursor-pointer">
                <span className="text-sm text-gray-600 dark:text-gray-400 max-w-[75%] pr-2">{t('settings.barcodeScanner.description')}</span>
                <div className="relative">
                  <input
                    id="barcode-toggle"
                    type="checkbox"
                    className="sr-only peer"
                    checked={isBarcodeScannerEnabled}
                    onChange={() => setIsBarcodeScannerEnabled(!isBarcodeScannerEnabled)}
                  />
                  <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-indigo-600"></div>
                </div>
              </label>
            </div>

            {/* AI Feature Toggle */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('settings.ai.title')}</h3>
              <label htmlFor="ai-toggle" className="flex items-center justify-between bg-gray-100 dark:bg-gray-900/50 p-3 rounded-lg cursor-pointer">
                <span className="text-sm text-gray-600 dark:text-gray-400 max-w-[75%] pr-2">{t('settings.ai.description')}</span>
                <div className="relative">
                  <input
                    id="ai-toggle"
                    type="checkbox"
                    className="sr-only peer"
                    checked={isAiEnabled}
                    onChange={() => setIsAiEnabled(!isAiEnabled)}
                    disabled={!currentKey}
                  />
                  <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-indigo-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                </div>
              </label>
            </div>

            {/* API Key Management */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('settings.apiManagement.title')}</h3>
                <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-900/50">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{t('settings.apiManagement.description')}</p>
                    {!currentKey || isEditingKey ? (
                         <div>
                            <ApiKeyTester onKeyVerified={handleKeyChange} />
                            {currentKey && isEditingKey && (
                                <button onClick={() => setIsEditingKey(false)} className="text-sm text-gray-600 dark:text-gray-400 hover:underline mt-2">
                                    {t('form.button.cancel')}
                                </button>
                            )}
                         </div>
                    ) : (
                        <div>
                             <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-md">
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('settings.apiManagement.currentKey')}</span>
                                {currentKey && (
                                    <code className="text-sm font-mono bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-1 px-2 rounded">{maskApiKey(currentKey)}</code>
                                )}
                            </div>
                            <div className="flex gap-2 mt-3">
                                <button onClick={() => setIsEditingKey(true)} className="flex-1 text-sm bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900 py-2 px-3 rounded-md font-semibold transition-colors">
                                    {t('settings.apiManagement.changeButton')}
                                </button>
                                {currentKey && (
                                    <button onClick={handleKeyRemove} className="flex-1 text-sm bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900 py-2 px-3 rounded-md font-semibold transition-colors">
                                        {t('settings.apiManagement.removeButton')}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
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
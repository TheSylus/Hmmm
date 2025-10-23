import React from 'react';
import { useTranslation } from '../i18n';
import { ApiKeyTester } from './ApiKeyTester';

interface ApiKeyModalProps {
    onKeySave: (apiKey: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onKeySave }) => {
    const { t } = useTranslation();

    // A dummy key to allow users to bypass the modal for manual entry.
    // This will be saved to localStorage and the main app will load.
    // The Gemini service will still fail if AI features are used,
    // but the user can then add a real key in settings.
    const handleManualBypass = () => {
        onKeySave('MANUAL_ENTRY_MODE');
    };

    return (
        <div className="fixed inset-0 bg-gray-100 dark:bg-gray-900 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-lg text-center">
                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-green-500 dark:from-indigo-400 dark:to-green-400 mb-4">
                    {t('apiKeyModal.title')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {t('apiKeyModal.description')}
                </p>

                <ApiKeyTester 
                    onKeyVerified={onKeySave} 
                    buttonText={t('apiKeyModal.button.testAndSave')} 
                />

                <div className="mt-4 text-sm">
                    <a 
                        href="https://aistudio.google.com/app/apikey" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                        {t('apiKeyModal.link.whereToGet')}
                    </a>
                </div>

                <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                    <button 
                        onClick={handleManualBypass}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white text-sm hover:underline"
                    >
                        {t('apiKeyModal.manualEntry')}
                    </button>
                </div>
            </div>
        </div>
    );
};
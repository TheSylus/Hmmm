import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useTranslation } from '../i18n/index';
import { SparklesIcon } from './Icons';

interface ApiKeyTesterProps {
    onKeyVerified: (apiKey: string) => void;
    buttonText?: string;
}

export const ApiKeyTester: React.FC<ApiKeyTesterProps> = ({ onKeyVerified, buttonText }) => {
    const { t } = useTranslation();
    const [apiKey, setApiKey] = useState('');
    const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isInvalidKeyError, setIsInvalidKeyError] = useState(false);

    const handleTestKey = async () => {
        const keyToTest = apiKey.trim();
        if (!keyToTest) return;
        
        setStatus('testing');
        setErrorMessage(null);
        setIsInvalidKeyError(false);
        
        try {
            const testAi = new GoogleGenAI({ apiKey: keyToTest });
            await testAi.models.generateContent({ model: 'gemini-2.5-flash', contents: 'hello' });
            
            setStatus('success');
            // If successful, call the callback to notify the parent.
            onKeyVerified(keyToTest);

        } catch (e) {
            setStatus('error');
            const message = e instanceof Error ? e.message : 'An unknown error occurred.';

            if (message.includes('API key not valid') || message.includes('API_KEY_INVALID')) {
                setIsInvalidKeyError(true);
            }
            
            setErrorMessage(message.replace(/\[\w+\/\w+\]\s*/, ''));
            console.error("API Key Test Failed:", e);
        }
    };

    const getStatusMessage = () => {
        switch (status) {
            case 'testing':
                return (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <SparklesIcon className="w-4 h-4 animate-pulse" />
                        <span>{t('settings.apiKeyTest.status.testing')}</span>
                    </div>
                );
            case 'success':
                return <p className="text-sm text-green-600 dark:text-green-400">{t('settings.apiKeyTest.status.success')}</p>;
            case 'error':
                if (isInvalidKeyError) {
                    return (
                        <p className="text-sm text-red-500 dark:text-red-400">
                            {t('settings.apiKeyTest.status.error.invalidKey.start')}
                            <a 
                                href="https://aistudio.google.com/app/apikey" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="underline hover:text-red-700 dark:hover:text-red-300 transition-colors"
                            >
                                {t('settings.apiKeyTest.status.error.invalidKey.linkText')}
                            </a>
                            {t('settings.apiKeyTest.status.error.invalidKey.end')}
                        </p>
                    );
                }
                return <p className="text-sm text-red-500 dark:text-red-400">{t('settings.apiKeyTest.status.error.generic', { message: errorMessage })}</p>;
            default:
                return null;
        }
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row gap-2">
                <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={t('settings.apiKeyTest.placeholder')}
                    className="flex-grow w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-2"
                />
                <button
                    onClick={handleTestKey}
                    disabled={status === 'testing' || !apiKey}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 dark:disabled:bg-gray-600"
                >
                    {buttonText || t('settings.apiKeyTest.button')}
                </button>
            </div>
            <div className="mt-2 min-h-[20px]">
                {getStatusMessage()}
            </div>
        </div>
    );
};
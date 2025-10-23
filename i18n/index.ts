import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

// Type for the translation function
type TFunction = (key: string, options?: Record<string, string | number>) => string;

// Define the context shape
interface I18nContextType {
  t: TFunction;
  setLanguage: (lang: 'en' | 'de') => void;
  language: 'en' | 'de';
  isLoaded: boolean;
}

// Create the context with a default value
const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Supported languages
const supportedLanguages = ['en', 'de'];

// Function to get the browser's preferred language
const getInitialLocale = (): 'en' | 'de' => {
  const browserLang = navigator.language.split('-')[0];
  if (supportedLanguages.includes(browserLang)) {
    return browserLang as 'en' | 'de';
  }
  return 'en'; // Default to English
};

// Provider component
export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'en' | 'de'>(getInitialLocale());
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        setIsLoaded(false);
        // Using fetch to load the JSON file, ensuring relative path is correct.
        const response = await fetch(`/i18n/${language}.json`);
        if (!response.ok) {
          throw new Error(`Failed to load ${language}.json`);
        }
        const data = await response.json();
        setTranslations(data);
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to fetch translations:', error);
        // Fallback to English if loading fails
        if (language !== 'en') {
          setLanguage('en');
        } else {
            // if english fails, we are in trouble. Set empty translations
            setTranslations({});
            setIsLoaded(true);
        }
      }
    };
    fetchTranslations();
  }, [language]);

  // The translation function
  const t: TFunction = (key, options) => {
    let translation = translations[key] || key;
    if (options) {
      Object.keys(options).forEach(optionKey => {
        translation = translation.replace(`{${optionKey}}`, String(options[optionKey]));
      });
    }
    return translation;
  };
  
  // Set the lang attribute on the html tag for accessibility
  useEffect(() => {
      document.documentElement.lang = language;
  }, [language]);

  const value = { t, setLanguage, language, isLoaded };

  // FIX: Replaced JSX with `React.createElement` calls to fix parsing errors in a .ts file.
  return React.createElement(
    I18nContext.Provider,
    { value },
    isLoaded ? children : React.createElement(
      'div',
      { className: 'fixed inset-0 bg-gray-900 flex items-center justify-center' },
      React.createElement('p', { className: 'text-white text-lg' }, 'Loading...')
    )
  );
};

// Custom hook to use the translation context
export const useTranslation = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

// By inlining the translations, we avoid any module resolution issues
// with JSON files that might occur in certain deployment environments.
const enTranslations = {
  "header.title": "Food Memory Tracker",
  "header.searchPlaceholder": "Search items...",
  "header.filter.all": "All Items",
  "header.filter.liked": "Liked (4-5 Stars)",
  "header.filter.disliked": "Disliked (1-2 Stars)",
  "footer.text": "Never forget a favorite again.",
  "form.addNewButton": "Add New Food Item",
  "form.editTitle": "Edit Food Item",
  "form.placeholder.name": "Product Name",
  "form.label.rating": "Rating:",
  "form.aria.rate": "Rate {star} star",
  "form.aria.ratePlural": "Rate {star} stars",
  "form.placeholder.notes": "Notes (e.g., taste, where you bought it)",
  "form.placeholder.tags": "Tags (comma, separated)",
  "form.label.nutriScore": "Nutri-Score:",
  "form.aria.selectNutriScore": "Select Nutri-Score {score}",
  "form.error.nameAndRating": "Please provide a name and a rating.",
  "form.error.apiKeyNotConfigured": "AI features cannot be used because the API key is not configured in the project settings. Please set the 'API_KEY' environment variable in your deployment settings and refresh the page.",
  "form.button.cancel": "Cancel",
  "form.button.save": "Save Item",
  "form.button.update": "Update Item",
  "form.image.loading": "Analyzing...",
  "form.image.removeAria": "Remove image",
  "form.image.placeholder": "Scan a product or upload an image to start",
  "form.button.scanNew": "Scan New",
  "form.button.upload": "Upload",
  "list.empty.title": "Your list is empty!",
  "list.empty.description": "Add a food item using the form above to start tracking your preferences.",
  "list.resultsFor": "Results for \"{searchTerm}\"",
  "card.deleteAria": "Delete {name}",
  "card.editAria": "Edit {name}",
  "camera.title": "Take a Picture",
  "camera.error": "Could not access the camera. Please check permissions and try again.",
  "camera.captureButton": "Capture Photo",
  "cropper.title": "Adjust Crop",
  "cropper.description": "Adjust the selection proposed by the AI or cancel to use the full image.",
  "cropper.button.cancel": "Cancel (Use Full)",
  "cropper.button.confirm": "Confirm Crop",
  "modal.image.closeAria": "Close image view",
  "modal.duplicate.title": "Potential Duplicate Found",
  "modal.duplicate.description": "An item named \"{itemName}\" already exists. Please review the item(s) below.",
  "modal.duplicate.button.goBack": "Go Back & Edit",
  "modal.duplicate.button.addAnyway": "Add Anyway",
  "settings.title": "Settings",
  "settings.closeAria": "Close settings",
  "settings.theme.title": "Theme",
  "settings.theme.light": "Light",
  "settings.theme.dark": "Dark",
  "settings.theme.system": "System",
  "settings.language.title": "Language",
  "settings.apiStatus.title": "API Configuration",
  "settings.apiStatus.configured": "API key successfully found and loaded.",
  "settings.apiStatus.notConfigured": "API key not found in project settings.",
  "settings.ai.title": "AI Features",
  "settings.ai.description": "Enable AI analysis to auto-fill details from photos.",
  "settings.apiKeyTest.title": "API Key Tester",
  "settings.apiKeyTest.description": "If you're having issues, you can test your API key directly here. This does not save the key.",
  "settings.apiKeyTest.placeholder": "Paste your API key here",
  "settings.apiKeyTest.button": "Test Key",
  "settings.apiKeyTest.status.testing": "Testing...",
  "settings.apiKeyTest.status.success": "Success! Your API key is working correctly.",
  "settings.apiKeyTest.status.error.generic": "Error: {message}",
  "settings.apiKeyTest.status.error.invalidKey.start": "Error: This API key is invalid. Please double-check it or ",
  "settings.apiKeyTest.status.error.invalidKey.linkText": "create a new one in Google AI Studio",
  "settings.apiKeyTest.status.error.invalidKey.end": ".",
  "settings.button.done": "Done",
  "settings.troubleshooting.title": "Troubleshooting Guide",
  "settings.troubleshooting.explanation": "Your key is valid (confirmed by the tester), but the app can't access it. This is a common issue with hosting platforms like Vercel.",
  "settings.troubleshooting.solution": "To fix this, you must add it as an Environment Variable in your Vercel project settings:",
  "settings.troubleshooting.step1": "Go to your Vercel project settings under 'Environment Variables'.",
  "settings.troubleshooting.step2": "Create a new variable with the exact name:",
  "settings.troubleshooting.step3": "Paste your API key as the value.",
  "settings.troubleshooting.step4": "Important: Redeploy your project for the change to take effect.",
  "settings.troubleshooting.vercelLink": "Open Vercel Dashboard"
};

const deTranslations = {
  "header.title": "Lebensmittel-Tracker",
  "header.searchPlaceholder": "Produkte suchen...",
  "header.filter.all": "Alle Produkte",
  "header.filter.liked": "Gemocht (4-5 Sterne)",
  "header.filter.disliked": "Nicht gemocht (1-2 Sterne)",
  "footer.text": "Vergiss nie wieder ein Lieblingsprodukt.",
  "form.addNewButton": "Neues Lebensmittel hinzufügen",
  "form.editTitle": "Lebensmittel bearbeiten",
  "form.placeholder.name": "Produktname",
  "form.label.rating": "Bewertung:",
  "form.aria.rate": "Bewerte {star} Stern",
  "form.aria.ratePlural": "Bewerte {star} Sterne",
  "form.placeholder.notes": "Notizen (z.B. Geschmack, wo gekauft)",
  "form.placeholder.tags": "Tags (mit Komma getrennt)",
  "form.label.nutriScore": "Nutri-Score:",
  "form.aria.selectNutriScore": "Nutri-Score {score} auswählen",
  "form.error.nameAndRating": "Bitte gib einen Namen und eine Bewertung an.",
  "form.error.apiKeyNotConfigured": "KI-Funktionen können nicht verwendet werden, da der API-Schlüssel nicht in den Projekteinstellungen konfiguriert ist. Bitte setzen Sie die 'API_KEY'-Umgebungsvariable in Ihren Deployment-Einstellungen und laden Sie die Seite neu.",
  "form.button.cancel": "Abbrechen",
  "form.button.save": "Produkt speichern",
  "form.button.update": "Produkt aktualisieren",
  "form.image.loading": "Analysiere...",
  "form.image.removeAria": "Bild entfernen",
  "form.image.placeholder": "Scanne ein Produkt oder lade ein Bild hoch, um zu beginnen",
  "form.button.scanNew": "Neu scannen",
  "form.button.upload": "Hochladen",
  "list.empty.title": "Deine Liste ist leer!",
  "list.empty.description": "Füge ein Lebensmittel über das obige Formular hinzu, um deine Vorlieben zu speichern.",
  "list.resultsFor": "Ergebnisse für \"{searchTerm}\"",
  "card.deleteAria": "Lösche {name}",
  "card.editAria": "Bearbeite {name}",
  "camera.title": "Foto aufnehmen",
  "camera.error": "Konnte nicht auf die Kamera zugreifen. Bitte überprüfe die Berechtigungen und versuche es erneut.",
  "camera.captureButton": "Foto aufnehmen",
  "cropper.title": "Zuschnitt anpassen",
  "cropper.description": "Passe die von der KI vorgeschlagene Auswahl an oder brich ab, um das ganze Bild zu verwenden.",
  "cropper.button.cancel": "Abbrechen (Ganzes Bild)",
  "cropper.button.confirm": "Zuschnitt bestätigen",
  "modal.image.closeAria": "Bildansicht schließen",
  "modal.duplicate.title": "Mögliches Duplikat gefunden",
  "modal.duplicate.description": "Ein Produkt mit dem Namen \"{itemName}\" existiert bereits. Bitte überprüfe die unten stehenden Produkte.",
  "modal.duplicate.button.goBack": "Zurück & Bearbeiten",
  "modal.duplicate.button.addAnyway": "Trotzdem hinzufügen",
  "settings.title": "Einstellungen",
  "settings.closeAria": "Einstellungen schließen",
  "settings.theme.title": "Design",
  "settings.theme.light": "Hell",
  "settings.theme.dark": "Dunkel",
  "settings.theme.system": "System",
  "settings.language.title": "Sprache",
  "settings.apiStatus.title": "API-Konfiguration",
  "settings.apiStatus.configured": "API-Schlüssel erfolgreich gefunden und geladen.",
  "settings.apiStatus.notConfigured": "API-Schlüssel in den Projekteinstellungen nicht gefunden.",
  "settings.ai.title": "KI-Funktionen",
  "settings.ai.description": "Aktiviere die KI-Analyse, um Details automatisch aus Fotos auszufüllen.",
  "settings.apiKeyTest.title": "API-Schlüssel-Tester",
  "settings.apiKeyTest.description": "Wenn Sie Probleme haben, können Sie Ihren API-Schlüssel hier direkt testen. Der Schlüssel wird nicht gespeichert.",
  "settings.apiKeyTest.placeholder": "Fügen Sie Ihren API-Schlüssel hier ein",
  "settings.apiKeyTest.button": "Schlüssel testen",
  "settings.apiKeyTest.status.testing": "Wird getestet...",
  "settings.apiKeyTest.status.success": "Erfolg! Ihr API-Schlüssel funktioniert korrekt.",
  "settings.apiKeyTest.status.error.generic": "Fehler: {message}",
  "settings.apiKeyTest.status.error.invalidKey.start": "Fehler: Dieser API-Schlüssel ist ungültig. Bitte überprüfen Sie ihn oder ",
  "settings.apiKeyTest.status.error.invalidKey.linkText": "erstellen Sie einen neuen im Google AI Studio",
  "settings.apiKeyTest.status.error.invalidKey.end": ".",
  "settings.button.done": "Fertig",
  "settings.troubleshooting.title": "Anleitung zur Fehlerbehebung",
  "settings.troubleshooting.explanation": "Ihr Schlüssel ist gültig (vom Tester bestätigt), aber die App kann ihn nicht finden. Das ist ein häufiges Problem bei Hosting-Plattformen wie Vercel.",
  "settings.troubleshooting.solution": "Um das zu beheben, müssen Sie ihn als Umgebungsvariable (Environment Variable) in Ihren Vercel-Projekteinstellungen hinzufügen:",
  "settings.troubleshooting.step1": "Gehen Sie zu Ihren Vercel-Projekteinstellungen unter 'Environment Variables'.",
  "settings.troubleshooting.step2": "Erstellen Sie eine neue Variable mit dem exakten Namen:",
  "settings.troubleshooting.step3": "Fügen Sie Ihren API-Schlüssel als Wert ein.",
  "settings.troubleshooting.step4": "Wichtig: Veröffentlichen Sie Ihr Projekt erneut (Redeploy), damit die Änderung wirksam wird.",
  "settings.troubleshooting.vercelLink": "Vercel Dashboard öffnen"
};

// Type for the translation function
type TFunction = (key: string, options?: Record<string, string | number>) => string;

// Define the context shape
interface I18nContextType {
  t: TFunction;
  setLanguage: (lang: 'en' | 'de') => void;
  language: 'en' | 'de';
}

// Create the context with a default value
const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Supported languages and their corresponding translation data
const translationsData: Record<'en' | 'de', Record<string, string>> = {
  en: enTranslations,
  de: deTranslations,
};

// Function to get the browser's preferred language
const getInitialLocale = (): 'en' | 'de' => {
  const browserLang = navigator.language.split('-')[0];
  if (browserLang in translationsData) {
    return browserLang as 'en' | 'de';
  }
  return 'en'; // Default to English
};

// Provider component
export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'en' | 'de'>(() => {
    const savedLang = localStorage.getItem('language');
    if (savedLang === 'en' || savedLang === 'de') {
      return savedLang;
    }
    return getInitialLocale();
  });


  // The translation function
  const t: TFunction = (key, options) => {
    const translationSet = translationsData[language];
    let translation = translationSet[key] || key;
    if (options) {
      Object.keys(options).forEach(optionKey => {
        translation = translation.replace(`{${optionKey}}`, String(options[optionKey]));
      });
    }
    return translation;
  };
  
  // Wrapper for setLanguage to also save to localStorage
  const handleSetLanguage = (lang: 'en' | 'de') => {
      setLanguage(lang);
      localStorage.setItem('language', lang);
  }

  // Set the lang attribute on the html tag for accessibility
  useEffect(() => {
      document.documentElement.lang = language;
  }, [language]);

  const value = { t, setLanguage: handleSetLanguage, language };

  // FIX: Replaced JSX with `React.createElement` calls to fix parsing errors in a .ts file.
  // Translations are now bundled, so we don't need a loading state.
  return React.createElement(I18nContext.Provider, { value }, children);
};

// Custom hook to use the translation context
export const useTranslation = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
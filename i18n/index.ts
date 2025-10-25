import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

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
  "form.error.genericAiError": "Could not analyze image with AI. Please try again or enter details manually.",
  "form.error.ingredientsAiError": "Could not analyze ingredients list.",
  "form.error.barcodeError": "Could not fetch product data for this barcode. The product may not be in the Open Food Facts database.",
  "form.button.cancel": "Cancel",
  "form.button.save": "Save Item",
  "form.button.update": "Update Item",
  "form.button.scanIngredients": "Scan Ingredients",
  "form.button.scanBarcode": "Scan Barcode",
  "form.image.removeAria": "Remove image",
  "form.image.placeholder": "Scan a product or upload an image to start",
  "form.button.scanNew": "Scan Photo",
  "form.button.upload": "Upload",
  "form.aiProgress.readingName": "Reading product name...",
  "form.aiProgress.findingScore": "Finding Nutri-Score...",
  "form.aiProgress.generatingTags": "Generating descriptive tags...",
  "form.aiProgress.searchingDatabase": "Searching database for extra info...",
  "form.aiProgress.locatingProduct": "Locating product in image...",
  "form.aiProgress.complete": "Analysis Complete!",
  "form.ingredients.title": "Ingredients & Dietary Info",
  "form.ingredients.loading": "Scanning ingredients list...",
  "form.ingredients.ingredientsList": "Ingredients",
  "form.ingredients.placeholder": "No ingredients found. Scan the barcode or ingredients list to add them.",
  "form.allergens.title": "Allergens",
  "form.dietary.title": "Dietary Information",
  "form.dietary.lactoseFree": "Lactose-Free",
  "form.dietary.vegan": "Vegan",
  "form.dietary.glutenFree": "Gluten-Free",
  "list.empty.title": "Your list is empty!",
  "list.empty.description": "Add a food item using the form above to start tracking your preferences.",
  "list.resultsFor": "Results for \"{searchTerm}\"",
  "card.deleteAria": "Delete {name}",
  "card.editAria": "Edit {name}",
  "card.lactoseFreeTooltip": "Lactose-Free",
  "card.veganTooltip": "Vegan",
  "card.glutenFreeTooltip": "Gluten-Free",
  "camera.title": "Take a Picture",
  "camera.error": "Could not access the camera. Please check permissions and try again.",
  "camera.captureButton": "Capture Photo",
  "barcodeScanner.title": "Scan Barcode",
  "barcodeScanner.description": "Point your camera at the product's barcode.",
  "barcodeScanner.error.permission": "Camera access was denied. Please allow camera access in your browser settings.",
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
  "settings.apiManagement.title": "API Key Management",
  "settings.apiManagement.description": "The API key is stored securely in your browser's local storage and is never sent anywhere except to the Google AI API.",
  "settings.apiManagement.currentKey": "Current Key:",
  "settings.apiManagement.noKey": "No API key is currently saved.",
  "settings.apiManagement.changeButton": "Change Key",
  "settings.apiManagement.removeButton": "Remove Key",
  "settings.ai.title": "AI Features",
  "settings.ai.description": "Enable AI analysis to auto-fill details from photos.",
  "settings.barcodeScanner.title": "Barcode Scanner",
  "settings.barcodeScanner.description": "Enable the barcode scanner feature to look up products.",
  "settings.apiKeyTest.title": "API Key Tester",
  "settings.apiKeyTest.description": "Test a new key before saving it.",
  "settings.apiKeyTest.placeholder": "Paste your API key here",
  "settings.apiKeyTest.button": "Test Key",
  "settings.apiKeyTest.status.testing": "Testing...",
  "settings.apiKeyTest.status.success": "Success! This key is working correctly.",
  "settings.apiKeyTest.status.error.generic": "Error: {message}",
  "settings.apiKeyTest.status.error.invalidKey.start": "Error: This API key is invalid. Please double-check it or ",
  "settings.apiKeyTest.status.error.invalidKey.linkText": "create a new one in Google AI Studio",
  "settings.apiKeyTest.status.error.invalidKey.end": ".",
  "settings.button.done": "Done",
  "apiKeyModal.title": "Welcome to Food Memory Tracker",
  "apiKeyModal.description": "To enable AI features like automatic product recognition, please enter your Google Gemini API key.",
  "apiKeyModal.inputPlaceholder": "Enter your Google Gemini API key",
  "apiKeyModal.button.testAndSave": "Test & Save Key",
  "apiKeyModal.link.whereToGet": "Where do I get a key?",
  "apiKeyBanner.text": "Enable AI features by adding a Google Gemini API key in the settings.",
  "apiKeyBanner.button": "Go to Settings",
  "allergen.gluten": "Contains Gluten",
  "allergen.dairy": "Contains Dairy",
  "allergen.peanuts": "Contains Peanuts",
  "allergen.tree_nuts": "Contains Tree Nuts",
  "allergen.soy": "Contains Soy",
  "allergen.eggs": "Contains Eggs",
  "allergen.fish": "Contains Fish",
  "allergen.shellfish": "Contains Shellfish"
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
  "form.error.genericAiError": "Bild konnte nicht mit KI analysiert werden. Bitte versuchen Sie es erneut oder geben Sie die Details manuell ein.",
  "form.error.ingredientsAiError": "Zutatenliste konnte nicht mit KI analysiert werden.",
  "form.error.barcodeError": "Produktdaten für diesen Barcode konnten nicht abgerufen werden. Das Produkt ist möglicherweise nicht in der Open Food Facts-Datenbank.",
  "form.button.cancel": "Abbrechen",
  "form.button.save": "Produkt speichern",
  "form.button.update": "Produkt aktualisieren",
  "form.button.scanIngredients": "Zutaten scannen",
  "form.button.scanBarcode": "Barcode scannen",
  "form.image.removeAria": "Bild entfernen",
  "form.image.placeholder": "Scanne ein Produkt oder lade ein Bild hoch, um zu beginnen",
  "form.button.scanNew": "Foto scannen",
  "form.button.upload": "Hochladen",
  "form.aiProgress.readingName": "Lese Produktnamen...",
  "form.aiProgress.findingScore": "Suche nach Nutri-Score...",
  "form.aiProgress.generatingTags": "Generiere passende Tags...",
  "form.aiProgress.searchingDatabase": "Suche in Datenbank nach Zusatzinfos...",
  "form.aiProgress.locatingProduct": "Lokalisiere Produkt im Bild...",
  "form.aiProgress.complete": "Analyse abgeschlossen!",
  "form.ingredients.title": "Zutaten & Ernährungsinfo",
  "form.ingredients.loading": "Zutatenliste wird gescannt...",
  "form.ingredients.ingredientsList": "Zutaten",
  "form.ingredients.placeholder": "Keine Zutaten gefunden. Scanne den Barcode oder die Zutatenliste, um sie hinzuzufügen.",
  "form.allergens.title": "Allergene",
  "form.dietary.title": "Ernährungsinformation",
  "form.dietary.lactoseFree": "Laktosefrei",
  "form.dietary.vegan": "Vegan",
  "form.dietary.glutenFree": "Glutenfrei",
  "list.empty.title": "Deine Liste ist leer!",
  "list.empty.description": "Füge ein Lebensmittel über das obige Formular hinzu, um deine Vorlieben zu speichern.",
  "list.resultsFor": "Ergebnisse für \"{searchTerm}\"",
  "card.deleteAria": "Lösche {name}",
  "card.editAria": "Bearbeite {name}",
  "card.lactoseFreeTooltip": "Laktosefrei",
  "card.veganTooltip": "Vegan",
  "card.glutenFreeTooltip": "Glutenfrei",
  "camera.title": "Foto aufnehmen",
  "camera.error": "Konnte nicht auf die Kamera zugreifen. Bitte überprüfe die Berechtigungen und versuche es erneut.",
  "camera.captureButton": "Foto aufnehmen",
  "barcodeScanner.title": "Barcode scannen",
  "barcodeScanner.description": "Richte deine Kamera auf den Barcode des Produkts.",
  "barcodeScanner.error.permission": "Kamerazugriff verweigert. Bitte erlauben Sie den Kamerazugriff in Ihren Browsereinstellungen.",
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
  "settings.apiManagement.title": "API-Schlüssel-Verwaltung",
  "settings.apiManagement.description": "Der API-Schlüssel wird sicher im lokalen Speicher Ihres Browsers gespeichert und nirgendwo anders als an die Google AI API gesendet.",
  "settings.apiManagement.currentKey": "Aktueller Schlüssel:",
  "settings.apiManagement.noKey": "Derzeit ist kein API-Schlüssel gespeichert.",
  "settings.apiManagement.changeButton": "Schlüssel ändern",
  "settings.apiManagement.removeButton": "Schlüssel entfernen",
  "settings.ai.title": "KI-Funktionen",
  "settings.ai.description": "Aktiviere die KI-Analyse, um Details automatisch aus Fotos auszufüllen.",
  "settings.barcodeScanner.title": "Barcode-Scanner",
  "settings.barcodeScanner.description": "Aktiviere die Barcode-Scanner-Funktion, um Produkte nachzuschlagen.",
  "settings.apiKeyTest.title": "API-Schlüssel-Tester",
  "settings.apiKeyTest.description": "Testen Sie einen neuen Schlüssel, bevor Sie ihn speichern.",
  "settings.apiKeyTest.placeholder": "Fügen Sie Ihren API-Schlüssel hier ein",
  "settings.apiKeyTest.button": "Schlüssel testen",
  "settings.apiKeyTest.status.testing": "Wird getestet...",
  "settings.apiKeyTest.status.success": "Erfolg! Dieser Schlüssel funktioniert korrekt.",
  "settings.apiKeyTest.status.error.generic": "Fehler: {message}",
  "settings.apiKeyTest.status.error.invalidKey.start": "Fehler: Dieser API-Schlüssel ist ungültig. Bitte überprüfen Sie ihn oder ",
  "settings.apiKeyTest.status.error.invalidKey.linkText": "erstellen Sie einen neuen im Google AI Studio",
  "settings.apiKeyTest.status.error.invalidKey.end": ".",
  "settings.button.done": "Fertig",
  "apiKeyModal.title": "Willkommen beim Lebensmittel-Tracker",
  "apiKeyModal.description": "Um KI-Funktionen wie die automatische Produkterkennung zu aktivieren, geben Sie bitte Ihren Google Gemini API-Schlüssel ein.",
  "apiKeyModal.inputPlaceholder": "Geben Sie Ihren Google Gemini API-Schlüssel ein",
  "apiKeyModal.button.testAndSave": "Schlüssel testen & speichern",
  "apiKeyModal.link.whereToGet": "Wo bekomme ich einen Schlüssel?",
  "apiKeyBanner.text": "Aktivieren Sie KI-Funktionen, indem Sie in den Einstellungen einen Google Gemini API-Schlüssel hinzufügen.",
  "apiKeyBanner.button": "Zu den Einstellungen",
  "allergen.gluten": "Enthält Gluten",
  "allergen.dairy": "Enthält Milchprodukte",
  "allergen.peanuts": "Enthält Erdnüsse",
  "allergen.tree_nuts": "Enthält Schalenfrüchte",
  "allergen.soy": "Enthält Soja",
  "allergen.eggs": "Enthält Eier",
  "allergen.fish": "Enthält Fisch",
  "allergen.shellfish": "Enthält Schalentiere"
};

// Type for the translation function
type TFunction = (key: string, options?: Record<string, string | number>) => string;

// Define the context shape
interface I18nContextType {
  t: TFunction;
  setLanguage: (lang: 'en' | 'de') => void;
  language: 'en' | 'de';
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const translationsData: Record<'en' | 'de', Record<string, string>> = {
  en: enTranslations,
  de: deTranslations,
};

const getInitialLocale = (): 'en' | 'de' => {
  const browserLang = navigator.language.split('-')[0];
  if (browserLang in translationsData) {
    return browserLang as 'en' | 'de';
  }
  return 'en';
};

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'en' | 'de'>(() => {
    const savedLang = localStorage.getItem('language');
    if (savedLang === 'en' || savedLang === 'de') {
      return savedLang;
    }
    return getInitialLocale();
  });

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
  
  const handleSetLanguage = (lang: 'en' | 'de') => {
      setLanguage(lang);
      localStorage.setItem('language', lang);
  }

  useEffect(() => {
      document.documentElement.lang = language;
  }, [language]);

  const value = { t, setLanguage: handleSetLanguage, language };

  return React.createElement(I18nContext.Provider, { value }, children);
};

export const useTranslation = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
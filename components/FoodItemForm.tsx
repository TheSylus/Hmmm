import React, { useState, FormEvent, useRef, useEffect } from 'react';
import { FoodItem, NutriScore } from '../types';
import { BoundingBox, analyzeFoodImage, analyzeIngredientsImage } from '../services/geminiService';
import { fetchProductFromOpenFoodFacts, searchProductByNameFromOpenFoodFacts } from '../services/openFoodFactsService';
import { CameraCapture } from './CameraCapture';
import { BarcodeScanner } from './BarcodeScanner';
import { SpeechInputModal } from './SpeechInputModal';
import { ImageCropper } from './ImageCropper';
import { StarIcon, SparklesIcon, CameraIcon, PlusCircleIcon, XMarkIcon, DocumentTextIcon, LactoseFreeIcon, VeganIcon, GlutenFreeIcon, BarcodeIcon, MicrophoneIcon, SpinnerIcon } from './Icons';
import { AllergenDisplay } from './AllergenDisplay';
import { useTranslation } from '../i18n/index';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { translateTexts } from '../services/translationService';

// Add type definitions for the Web Speech API for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface FoodItemFormProps {
  onSaveItem: (item: Omit<FoodItem, 'id'>) => void;
  onCancel: () => void;
  initialData?: FoodItem | null;
}

const nutriScoreOptions: NutriScore[] = ['A', 'B', 'C', 'D', 'E'];
const nutriScoreColors: Record<NutriScore, string> = {
  A: 'bg-green-600',
  B: 'bg-lime-600',
  C: 'bg-yellow-500',
  D: 'bg-orange-500',
  E: 'bg-red-600',
};

export const FoodItemForm: React.FC<FoodItemFormProps> = ({ onSaveItem, onCancel, initialData }) => {
  const { t, language } = useTranslation();
  const { isAiEnabled, isBarcodeScannerEnabled, isOffSearchEnabled } = useAppSettings();
  
  const isEditing = !!initialData;
  const isAiAvailable = isAiEnabled;

  // Form state
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [nutriScore, setNutriScore] = useState<NutriScore | ''>('');
  const [tags, setTags] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [dietary, setDietary] = useState({
    isLactoseFree: false,
    isVegan: false,
    isGlutenFree: false,
  });

  // UI/Flow state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isSpeechModalOpen, setIsSpeechModalOpen] = useState(false);
  const [isNameSearchLoading, setIsNameSearchLoading] = useState(false);
  const [scanMode, setScanMode] = useState<'main' | 'ingredients'>('main');
  const [uncroppedImage, setUncroppedImage] = useState<string | null>(null);
  const [suggestedCrop, setSuggestedCrop] = useState<BoundingBox | null | undefined>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({ active: false, message: '' });
  const [highlightedFields, setHighlightedFields] = useState<string[]>([]);
  const [isIngredientsLoading, setIngredientsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setRating(initialData.rating);
      setNotes(initialData.notes || '');
      setImage(initialData.image || null);
      setNutriScore(initialData.nutriScore || '');
      setTags(initialData.tags?.join(', ') || '');
      setIngredients(initialData.ingredients || []);
      setAllergens(initialData.allergens || []);
      setDietary({
        isLactoseFree: initialData.isLactoseFree || false,
        isVegan: initialData.isVegan || false,
        isGlutenFree: initialData.isGlutenFree || false,
      });
    } else {
      resetFormState();
    }
  }, [initialData]);

  useEffect(() => {
    if (highlightedFields.length > 0) {
      const timer = setTimeout(() => {
        setHighlightedFields([]);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [highlightedFields]);


  const resetFormState = () => {
    setName('');
    setRating(0);
    setNotes('');
    setImage(null);
    setNutriScore('');
    setTags('');
    setIngredients([]);
    setAllergens([]);
    setDietary({ isLactoseFree: false, isVegan: false, isGlutenFree: false });
    setError(null);
    setIsLoading(false);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleScanMainImage = () => {
    setScanMode('main');
    setIsCameraOpen(true);
  };

  const handleScanIngredients = () => {
    setScanMode('ingredients');
    setIsCameraOpen(true);
  };

  const processSpokenProductName = async (productName: string) => {
    if (!productName || !isOffSearchEnabled) return;
    
    setIsNameSearchLoading(true);
    setError(null);
    try {
      const offResult = await searchProductByNameFromOpenFoodFacts(productName);
      
      let mergedData = {
          tags: offResult.tags || [],
          nutriScore: (offResult.nutriScore || '') as NutriScore | '',
          ingredients: offResult.ingredients || [],
          allergens: offResult.allergens || [],
          isLactoseFree: offResult.isLactoseFree || false,
          isVegan: offResult.isVegan || false,
          isGlutenFree: offResult.isGlutenFree || false,
      };

      const newHighlightedFields: string[] = [];
      if (mergedData.tags.length > 0) newHighlightedFields.push('tags');
      if (mergedData.nutriScore) newHighlightedFields.push('nutriScore');

      if (language !== 'en' && (mergedData.tags.length > 0 || mergedData.ingredients.length > 0 || mergedData.allergens.length > 0)) {
          const textsToTranslate = [...mergedData.tags, ...mergedData.ingredients, ...mergedData.allergens];
          try {
              const translated = await translateTexts(textsToTranslate, language);
              let i = 0;
              mergedData.tags = translated.slice(i, i + mergedData.tags.length);
              i += mergedData.tags.length;
              mergedData.ingredients = translated.slice(i, i + mergedData.ingredients.length);
              i += mergedData.ingredients.length;
              mergedData.allergens = translated.slice(i, i + mergedData.allergens.length);
          } catch (e) {
              console.error("Failed to translate OFF results for form", e);
          }
      }

      setTags(current => (current ? `${current}, ` : '') + mergedData.tags.join(', '));
      if(!nutriScore) setNutriScore(mergedData.nutriScore);
      setIngredients(current => [...current, ...mergedData.ingredients]);
      setAllergens(current => [...current, ...mergedData.allergens]);
      setDietary(current => ({
          isLactoseFree: current.isLactoseFree || mergedData.isLactoseFree,
          isVegan: current.isVegan || mergedData.isVegan,
          isGlutenFree: current.isGlutenFree || mergedData.isGlutenFree,
      }));
      setHighlightedFields(newHighlightedFields);
    } catch (e) {
      console.error("Error searching by product name:", e);
      // Non-critical error, do not show to user
    } finally {
      setIsNameSearchLoading(false);
    }
  };
  
  const handleDictationResult = (transcript: string) => {
    setIsSpeechModalOpen(false);
    if (transcript) {
      setName(transcript);
      processSpokenProductName(transcript);
    }
  };
  
  const handleBarcodeScanned = async (barcode: string) => {
    setIsBarcodeScannerOpen(false);
    setError(null);

    if (!isOffSearchEnabled) {
      setError(t('form.error.offSearchDisabled'));
      return;
    }

    setIsLoading(true);
    try {
      const productData = await fetchProductFromOpenFoodFacts(barcode);
      
      let finalName = productData.name || '';
      let finalTags = productData.tags || [];
      let finalIngredients = productData.ingredients || [];
      let finalAllergens = productData.allergens || [];

      if (language !== 'en' && isAiAvailable) {
        const textsToTranslate = [finalName, ...finalTags, ...finalIngredients, ...finalAllergens];
        try {
          const translated = await translateTexts(textsToTranslate, language);
          let currentIndex = 0;
          finalName = translated[currentIndex++];
          finalTags = translated.slice(currentIndex, currentIndex + finalTags.length);
          currentIndex += finalTags.length;
          finalIngredients = translated.slice(currentIndex, currentIndex + finalIngredients.length);
          currentIndex += finalIngredients.length;
          finalAllergens = translated.slice(currentIndex, currentIndex + finalAllergens.length);
        } catch (e) {
          console.error("Failed to translate OFF results for form", e);
        }
      }

      setName(finalName);
      setTags(finalTags.join(', '));
      setNutriScore((productData.nutriScore?.toUpperCase() as NutriScore) || '');
      setImage(productData.image || null);
      setIngredients(finalIngredients);
      setAllergens(finalAllergens);
      setDietary({
        isLactoseFree: productData.isLactoseFree || false,
        isVegan: productData.isVegan || false,
        isGlutenFree: productData.isGlutenFree || false,
      });

    } catch(e) {
       console.error(e);
       const errorMessage = e instanceof Error ? e.message : t('form.error.barcodeError');
       setError(errorMessage);
    } finally {
        setIsLoading(false);
    }
  };

  const handleImageFromCamera = async (imageDataUrl: string) => {
    setIsCameraOpen(false);
    setError(null);
  
    if (!isAiAvailable) {
      setUncroppedImage(imageDataUrl);
      setSuggestedCrop(null);
      setIsCropperOpen(true);
      return;
    }
  
    if (scanMode === 'main') {
      let progressInterval: number | undefined;
      try {
        const progressMessages = [
            t('form.aiProgress.readingName'),
            t('form.aiProgress.findingScore'),
            t('form.aiProgress.generatingTags'),
            ...(isOffSearchEnabled ? [t('form.aiProgress.searchingDatabase')] : []),
            t('form.aiProgress.locatingProduct')
        ];
        setAnalysisProgress({ active: true, message: progressMessages[0] });
        let messageIndex = 0;
        progressInterval = window.setInterval(() => {
            messageIndex = (messageIndex + 1) % progressMessages.length;
            setAnalysisProgress(prev => ({ ...prev, message: progressMessages[messageIndex] }));
        }, 1500);

        // Step 1: Analyze image with AI
        const aiResult = await analyzeFoodImage(imageDataUrl);
        
        // Step 2: Fetch supplementary data from Open Food Facts
        let offResult: Partial<FoodItem> = {};
        if (aiResult.name && isOffSearchEnabled) {
            try {
                setAnalysisProgress(prev => ({ ...prev, message: t('form.aiProgress.searchingDatabase') }));
                offResult = await searchProductByNameFromOpenFoodFacts(aiResult.name);
            } catch (offError) {
                console.warn("Could not fetch supplementary data from Open Food Facts:", offError);
                // Non-critical error, proceed with AI data only
            }
        }
        
        if(progressInterval) clearInterval(progressInterval);
        setAnalysisProgress({ active: true, message: t('form.aiProgress.complete') });
        
        // Step 3: Merge AI and OFF results
        const combinedTags = new Set([...(aiResult.tags || []), ...(offResult.tags || [])]);

        let mergedData = {
            name: aiResult.name || '',
            tags: Array.from(combinedTags),
            nutriScore: (aiResult.nutriScore || offResult.nutriScore || '') as NutriScore | '',
            ingredients: offResult.ingredients || [],
            allergens: offResult.allergens || [],
            isLactoseFree: offResult.isLactoseFree || false,
            isVegan: offResult.isVegan || false,
            isGlutenFree: offResult.isGlutenFree || false,
        };
        
        const newHighlightedFields: string[] = [];
        if (mergedData.name) newHighlightedFields.push('name');
        if (mergedData.tags.length > 0) newHighlightedFields.push('tags');
        if (mergedData.nutriScore) newHighlightedFields.push('nutriScore');

        // Step 4: Translate if necessary
        if (language !== 'en' && textsNeedTranslation(mergedData)) {
            const textsToTranslate = [
                mergedData.name, ...mergedData.tags, ...mergedData.ingredients, ...mergedData.allergens
            ];
            
            try {
                const translated = await translateTexts(textsToTranslate, language);
                if (translated.length === textsToTranslate.length) {
                    let i = 0;
                    mergedData.name = translated[i++];
                    mergedData.tags = translated.slice(i, i + mergedData.tags.length);
                    i += mergedData.tags.length;
                    mergedData.ingredients = translated.slice(i, i + mergedData.ingredients.length);
                    i += mergedData.ingredients.length;
                    mergedData.allergens = translated.slice(i, i + mergedData.allergens.length);
                }
            } catch (e) {
                console.error("Failed to translate merged AI/OFF results for form", e);
            }
        }
        
        // Step 5: Set form state
        setName(mergedData.name);
        setTags(mergedData.tags.join(', '));
        setNutriScore(mergedData.nutriScore);
        setIngredients(mergedData.ingredients);
        setAllergens(mergedData.allergens);
        setDietary({
            isLactoseFree: mergedData.isLactoseFree,
            isVegan: mergedData.isVegan,
            isGlutenFree: mergedData.isGlutenFree,
        });

        setUncroppedImage(imageDataUrl);
        setSuggestedCrop(aiResult.boundingBox);
        setIsCropperOpen(true);
        setHighlightedFields(newHighlightedFields);

      } catch (e) {
        if(progressInterval) clearInterval(progressInterval);
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : t('form.error.genericAiError');
        setError(errorMessage);
        setUncroppedImage(imageDataUrl);
        setSuggestedCrop(null);
        setIsCropperOpen(true);
      } finally {
         setTimeout(() => setAnalysisProgress({ active: false, message: '' }), 500);
      }
    } else { // scanMode === 'ingredients'
      setIngredientsLoading(true);
      try {
        const result = await analyzeIngredientsImage(imageDataUrl);

        let finalIngredients = result.ingredients || [];
        let finalAllergens = result.allergens || [];
        
        if (language !== 'en' && (finalIngredients.length > 0 || finalAllergens.length > 0)) {
            try {
                const textsToTranslate = [...finalIngredients, ...finalAllergens];
                const translated = await translateTexts(textsToTranslate, language);
                if (translated.length === textsToTranslate.length) {
                    finalIngredients = translated.slice(0, finalIngredients.length);
                    finalAllergens = translated.slice(finalIngredients.length);
                }
            } catch(e) {
                console.error("Failed to translate ingredients AI results for form", e);
            }
        }

        setIngredients(finalIngredients);
        setAllergens(finalAllergens);
        setDietary({
            isLactoseFree: result.isLactoseFree,
            isVegan: result.isVegan,
            isGlutenFree: result.isGlutenFree,
        });
      } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : t('form.error.ingredientsAiError');
        setError(errorMessage);
      } finally {
        setIngredientsLoading(false);
      }
    }
  };

  const textsNeedTranslation = (data: {name:string, tags:string[], ingredients:string[], allergens:string[]}) => {
    return data.name || data.tags.length > 0 || data.ingredients.length > 0 || data.allergens.length > 0;
  }

  const handleCropComplete = (croppedImageUrl: string) => {
    setImage(croppedImageUrl);
    setIsCropperOpen(false);
    setUncroppedImage(null);
    setSuggestedCrop(null);
  };
  
  const handleCropCancel = () => {
    if (uncroppedImage) setImage(uncroppedImage);
    setIsCropperOpen(false);
    setUncroppedImage(null);
    setSuggestedCrop(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setScanMode('main'); // File upload is always for the main image
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleImageFromCamera(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDietaryChange = (key: keyof typeof dietary) => {
    setDietary(prev => ({...prev, [key]: !prev[key]}));
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || rating === 0) {
      setError(t('form.error.nameAndRating'));
      return;
    }

    onSaveItem({
      name,
      rating,
      notes: notes || undefined,
      image: image || undefined,
      nutriScore: nutriScore || undefined,
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
      ingredients: ingredients.length > 0 ? ingredients : undefined,
      allergens: allergens.length > 0 ? allergens : undefined,
      isLactoseFree: dietary.isLactoseFree,
      isVegan: dietary.isVegan,
      isGlutenFree: dietary.isGlutenFree,
    });
  };

  const removeImage = () => {
    setImage(null);
    if(fileInputRef.current) fileInputRef.current.value = '';
  }
  
  return (
    <>
      <style>{`
        .highlight-ai {
          animation: highlight-ai-anim 2.5s ease-out;
        }
        @keyframes highlight-ai-anim {
          0% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
          25% { box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.5); }
          100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
        }
        .dark .highlight-ai {
            animation-name: highlight-ai-anim-dark;
        }
        @keyframes highlight-ai-anim-dark {
          0% { box-shadow: 0 0 0 0 rgba(129, 140, 248, 0); }
          25% { box-shadow: 0 0 0 4px rgba(129, 140, 248, 0.4); }
          100% { box-shadow: 0 0 0 0 rgba(129, 140, 248, 0); }
        }
      `}</style>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg mb-8">
         <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center -mb-2">
            {isEditing ? t('form.editTitle') : t('form.addNewButton')}
        </h2>
        <div className="flex flex-col md:flex-row gap-4 mt-6">
            <div className="w-full md:w-1/3 flex-shrink-0">
                <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center relative overflow-hidden text-gray-500 dark:text-gray-400">
                    {analysisProgress.active && (
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20 p-4">
                            <SparklesIcon className="w-10 h-10 animate-pulse text-indigo-400" />
                            <p className="mt-2 text-sm text-gray-300 text-center">{analysisProgress.message}</p>
                        </div>
                    )}
                    {isLoading && !analysisProgress.active && (
                         <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20">
                            <div className="w-10 h-10 border-4 border-t-indigo-400 border-gray-400 rounded-full animate-spin"></div>
                         </div>
                    )}
                    {image ? (
                        <>
                            <img src={image} alt="Preview" className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={removeImage}
                                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/80 transition"
                                aria-label={t('form.image.removeAria')}
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </>
                    ) : (
                         <div className="text-center p-4">
                            <CameraIcon className="w-16 h-16 mx-auto" />
                            <p className="mt-2 text-sm">{t('form.image.placeholder')}</p>
                        </div>
                    )}
                </div>
                <div className={`grid ${isBarcodeScannerEnabled ? 'grid-cols-3' : 'grid-cols-2'} gap-2 mt-2`}>
                    {isBarcodeScannerEnabled && (
                        <button type="button" onClick={() => setIsBarcodeScannerOpen(true)} className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-3 rounded-md transition disabled:bg-sky-400 dark:disabled:bg-gray-600 text-sm" disabled={isLoading || analysisProgress.active}>
                            <BarcodeIcon className="w-5 h-5" />
                            <span>{t('form.button.scanBarcode')}</span>
                        </button>
                    )}
                    <button type="button" onClick={handleScanMainImage} className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3 rounded-md transition disabled:bg-indigo-400 dark:disabled:bg-gray-600 text-sm" disabled={isLoading || analysisProgress.active}>
                        <CameraIcon className="w-5 h-5" />
                        <span>{t('form.button.scanNew')}</span>
                    </button>
                    <button type="button" onClick={() => setIsSpeechModalOpen(true)} className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-3 rounded-md transition disabled:bg-teal-400 dark:disabled:bg-gray-600 text-sm" disabled={isLoading || analysisProgress.active}>
                        <MicrophoneIcon className="w-5 h-5" />
                        <span>{t('form.button.dictate')}</span>
                    </button>
                </div>
                 <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full mt-2 flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md transition disabled:bg-gray-400 dark:disabled:bg-gray-500"
                    disabled={isLoading || analysisProgress.active}
                >
                    <PlusCircleIcon className="w-5 h-5" />
                    <span>{t('form.button.upload')}</span>
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </div>

            <div className="w-full md:w-2/3 space-y-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder={t('form.placeholder.name')}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        className={`w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3 transition-shadow ${highlightedFields.includes('name') ? 'highlight-ai' : ''} ${isNameSearchLoading ? 'pr-10' : ''}`}
                    />
                    {isNameSearchLoading && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <SpinnerIcon className="w-5 h-5 text-gray-400" />
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <label className="text-gray-700 dark:text-gray-300 font-medium">{t('form.label.rating')}</label>
                    <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                type="button"
                                key={star}
                                onClick={() => setRating(star)}
                                className="text-gray-400 dark:text-gray-600 hover:text-yellow-400 transition"
                                aria-label={t(star > 1 ? 'form.aria.ratePlural' : 'form.aria.rate', { star })}
                            >
                                <StarIcon className={`w-8 h-8 ${rating >= star ? 'text-yellow-400' : ''}`} filled={rating >= star} />
                            </button>
                        ))}
                    </div>
                </div>
                <textarea
                    placeholder={t('form.placeholder.notes')}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3"
                />
                <input
                    type="text"
                    placeholder={t('form.placeholder.tags')}
                    value={tags}
                    onChange={e => setTags(e.target.value)}
                    className={`w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3 transition-shadow ${highlightedFields.includes('tags') ? 'highlight-ai' : ''}`}
                />
                <div className={`p-2 rounded-md transition-shadow ${highlightedFields.includes('nutriScore') ? 'highlight-ai' : ''}`}>
                    <div className="flex items-center gap-4">
                        <label className="text-gray-700 dark:text-gray-300 font-medium shrink-0">{t('form.label.nutriScore')}</label>
                        <div className="flex items-center gap-2 flex-wrap">
                            {nutriScoreOptions.map(score => (
                                <button
                                    type="button"
                                    key={score}
                                    onClick={() => setNutriScore(current => current === score ? '' : score)}
                                    className={`w-8 h-8 rounded-full text-white font-bold flex items-center justify-center transition-transform transform ${nutriScoreColors[score]} ${nutriScore === score ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 scale-110' : 'hover:scale-105'}`}
                                    aria-pressed={nutriScore === score}
                                    aria-label={t('form.aria.selectNutriScore', { score })}
                                >
                                    {score}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                 {/* Ingredients and Dietary Section */}
                 <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700/50">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t('form.ingredients.title')}</h3>
                        {isAiAvailable && image && (
                            <button
                                type="button"
                                onClick={handleScanIngredients}
                                disabled={isIngredientsLoading}
                                className="flex items-center gap-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-1.5 px-3 rounded-md transition disabled:opacity-50"
                            >
                                <DocumentTextIcon className="w-4 h-4" />
                                <span>{t('form.button.scanIngredients')}</span>
                            </button>
                        )}
                    </div>
                    {isIngredientsLoading ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                             <SparklesIcon className="w-4 h-4 animate-pulse" />
                            <span>{t('form.ingredients.loading')}</span>
                        </div>
                    ) : (
                        <div>
                             <div className="mb-2">
                                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{t('form.dietary.title')}:</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    <button type="button" onClick={() => handleDietaryChange('isLactoseFree')} aria-pressed={dietary.isLactoseFree} className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border-2 transition-colors ${dietary.isLactoseFree ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-500 dark:border-blue-400 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700/50 border-transparent text-blue-600 dark:text-blue-400 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                                        <LactoseFreeIcon className="w-7 h-7" />
                                        <span className="text-xs font-semibold">{t('form.dietary.lactoseFree')}</span>
                                    </button>
                                    <button type="button" onClick={() => handleDietaryChange('isVegan')} aria-pressed={dietary.isVegan} className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border-2 transition-colors ${dietary.isVegan ? 'bg-green-100 dark:bg-green-900/50 border-green-500 dark:border-green-400 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700/50 border-transparent hover:border-gray-300 dark:hover:border-gray-600'}`}>
                                        <VeganIcon className="w-7 h-7" />
                                        <span className="text-xs font-semibold">{t('form.dietary.vegan')}</span>
                                    </button>
                                    <button type="button" onClick={() => handleDietaryChange('isGlutenFree')} aria-pressed={dietary.isGlutenFree} className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border-2 transition-colors ${dietary.isGlutenFree ? 'bg-amber-100 dark:bg-amber-900/50 border-amber-500 dark:border-amber-400 text-amber-700 dark:text-amber-300' : 'bg-gray-100 dark:bg-gray-700/50 border-transparent hover:border-gray-300 dark:hover:border-gray-600'}`}>
                                        <GlutenFreeIcon className="w-7 h-7" />
                                        <span className="text-xs font-semibold">{t('form.dietary.glutenFree')}</span>
                                    </button>
                                </div>
                            </div>
                            {allergens.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 mt-3">{t('form.allergens.title')}:</h4>
                                    <AllergenDisplay allergens={allergens} />
                                </div>
                            )}
                             {ingredients.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 mt-3">{t('form.ingredients.ingredientsList')}:</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 italic leading-snug">{ingredients.join(', ')}</p>
                                </div>
                            )}
                            {ingredients.length === 0 && (
                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">{t('form.ingredients.placeholder')}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
        
        {error && <p className="text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/50 p-3 rounded-md text-sm mt-4">{error}</p>}
        
        <div className="flex flex-col sm:flex-row gap-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-md transition-colors"
            >
              {t('form.button.cancel')}
            </button>
            <button
              type="submit"
              className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md transition-colors text-lg disabled:bg-green-400 dark:disabled:bg-gray-600"
              disabled={isLoading || analysisProgress.active || isIngredientsLoading || !name || rating === 0}
            >
              <PlusCircleIcon className="w-6 h-6" />
              {isEditing ? t('form.button.update') : t('form.button.save')}
            </button>
        </div>
      </form>

      {isCameraOpen && <CameraCapture onCapture={handleImageFromCamera} onClose={() => setIsCameraOpen(false)} />}
      {isBarcodeScannerOpen && <BarcodeScanner onScan={handleBarcodeScanned} onClose={() => setIsBarcodeScannerOpen(false)} />}
      {isSpeechModalOpen && <SpeechInputModal onDictate={handleDictationResult} onClose={() => setIsSpeechModalOpen(false)} />}
      {isCropperOpen && uncroppedImage && <ImageCropper imageUrl={uncroppedImage} suggestedCrop={suggestedCrop} onCrop={handleCropComplete} onCancel={handleCropCancel} />}
    </>
  );
};
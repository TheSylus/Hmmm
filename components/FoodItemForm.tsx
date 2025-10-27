import React, { useState, useEffect, useRef } from 'react';
import { FoodItem, NutriScore } from '../types';
import { useTranslation } from '../i18n/index';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { analyzeFoodImage, analyzeIngredientsImage, BoundingBox } from '../services/geminiService';
import { fetchProductFromOpenFoodFacts, searchProductByNameFromOpenFoodFacts } from '../services/openFoodFactsService';
import { CameraCapture } from './CameraCapture';
import { BarcodeScanner } from './BarcodeScanner';
import { ImageCropper } from './ImageCropper';
import { StarIcon, XMarkIcon, SparklesIcon, CameraIcon, UploadIcon, BarcodeIcon, MicrophoneIcon } from './Icons';

interface FoodItemFormProps {
  onSaveItem: (itemData: Omit<FoodItem, 'id'>) => void;
  onCancel: () => void;
  initialData?: FoodItem | null;
}

const initialFormState: Omit<FoodItem, 'id'> = {
  name: '',
  rating: 0,
  notes: '',
  image: '',
  nutriScore: undefined,
  tags: [],
  ingredients: [],
  allergens: [],
  isLactoseFree: false,
  isVegan: false,
  isGlutenFree: false,
};

export const FoodItemForm: React.FC<FoodItemFormProps> = ({ onSaveItem, onCancel, initialData }) => {
  const { t } = useTranslation();
  const { isAiEnabled, isBarcodeScannerEnabled, isOffSearchEnabled } = useAppSettings();

  const [formData, setFormData] = useState<Omit<FoodItem, 'id'>>(initialFormState);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [suggestedCrop, setSuggestedCrop] = useState<BoundingBox | null>(null);

  const [aiProgress, setAiProgress] = useState<string[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isIngredientsLoading, setIsIngredientsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setTagInput(initialData.tags?.join(', ') || '');
    } else {
      setFormData(initialFormState);
      setTagInput('');
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRatingChange = (newRating: number) => {
    setFormData(prev => ({ ...prev, rating: newRating }));
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, tags }));
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({...prev, [name]: checked}));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.rating === 0) {
      setError(t('form.error.nameAndRating'));
      return;
    }
    setError('');
    onSaveItem(formData);
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (event) => {
            if(event.target?.result) {
                const base64 = event.target.result as string;
                if (isAiEnabled) {
                    setImageToCrop(base64);
                    handleAiAnalysis(base64);
                } else {
                    setFormData(prev => ({...prev, image: base64}));
                }
            }
        };
        reader.readAsDataURL(e.target.files[0]);
      }
  };

  const handleCapture = (imageDataUrl: string) => {
    setIsCameraOpen(false);
    if (isAiEnabled) {
      setImageToCrop(imageDataUrl);
      handleAiAnalysis(imageDataUrl);
    } else {
        setFormData(prev => ({...prev, image: imageDataUrl}));
    }
  };
  
  const handleCrop = (croppedImageUrl: string) => {
    setFormData(prev => ({ ...prev, image: croppedImageUrl }));
    setImageToCrop(null);
    setSuggestedCrop(null);
  };

  const handleAiAnalysis = async (base64Image: string) => {
    setIsAiLoading(true);
    setError('');
    setAiProgress([t('form.aiProgress.locatingProduct')]);

    try {
        const { name, tags, nutriScore, boundingBox } = await analyzeFoodImage(base64Image);
        
        setAiProgress(prev => [...prev, t('form.aiProgress.readingName')]);
        if (boundingBox) setSuggestedCrop(boundingBox);

        let finalData: Partial<FoodItem> = {
            name,
            tags,
            nutriScore: nutriScore || undefined,
        };

        setAiProgress(prev => [...prev, t('form.aiProgress.generatingTags'), t('form.aiProgress.findingScore')]);

        if (isOffSearchEnabled && name) {
            setAiProgress(prev => [...prev, t('form.aiProgress.searchingDatabase')]);
            try {
                const offData = await searchProductByNameFromOpenFoodFacts(name);
                finalData = {...offData, ...finalData}; // AI data takes precedence
            } catch (offError) {
                console.warn("Open Food Facts search failed, using only AI data.", offError);
            }
        }
        
        setFormData(prev => ({...prev, ...finalData}));
        setTagInput(finalData.tags?.join(', ') || '');
        setAiProgress(prev => [...prev, t('form.aiProgress.complete')]);
    } catch (e) {
        console.error("AI analysis failed:", e);
        setError(t('form.error.genericAiError'));
        setFormData(prev => ({...prev, image: base64Image})); // Use full image if AI fails
        setImageToCrop(null); // Close cropper
    } finally {
        setTimeout(() => setIsAiLoading(false), 1500);
    }
  };

  const handleScanIngredients = async () => {
    if (!formData.image) return;
    setIsIngredientsLoading(true);
    setError('');
    try {
      const result = await analyzeIngredientsImage(formData.image);
      setFormData(prev => ({...prev, ...result}));
    } catch (e) {
        console.error("Ingredients analysis failed:", e);
        setError(t('form.error.ingredientsAiError'));
    } finally {
        setIsIngredientsLoading(false);
    }
  };
  
  const handleBarcodeScan = async (barcode: string) => {
    setIsScannerOpen(false);
    if (!isOffSearchEnabled) {
        setError(t('form.error.offSearchDisabled'));
        return;
    }
    setIsAiLoading(true);
    setError('');
    setAiProgress([t('form.aiProgress.searchingDatabase')]);
    try {
        const productData = await fetchProductFromOpenFoodFacts(barcode);
        setFormData(prev => ({...prev, ...productData}));
        if(productData.tags) setTagInput(productData.tags.join(', '));
        setAiProgress(prev => [...prev, t('form.aiProgress.complete')]);
    } catch (e) {
        console.error("Barcode scan failed:", e);
        setError(t('form.error.barcodeError'));
    } finally {
        setTimeout(() => setIsAiLoading(false), 1500);
    }
  };


  const renderImageState = () => {
    if (formData.image) {
        return (
            <div className="relative group">
                <img src={formData.image} alt={formData.name} className="w-full h-48 object-cover rounded-lg shadow-md" />
                <button
                    onClick={() => setFormData(p => ({...p, image: ''}))}
                    className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={t('form.image.removeAria')}
                >
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </div>
        )
    }
    return (
        <div className="w-full h-48 bg-gray-200 dark:bg-gray-700/50 rounded-lg flex flex-col items-center justify-center text-center p-4">
            <p className="text-gray-500 dark:text-gray-400 mb-4">{t('form.image.placeholder')}</p>
            <div className="flex gap-2">
                <button type="button" onClick={() => setIsCameraOpen(true)} className="flex-1 px-3 py-2 bg-indigo-500 text-white text-sm rounded-md hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2">
                    <CameraIcon className="w-4 h-4" /> {t('form.button.scanNew')}
                </button>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
                    <UploadIcon className="w-4 h-4" /> {t('form.button.upload')}
                </button>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
            </div>
        </div>
    )
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{initialData ? t('form.editTitle') : t('form.addNewButton')}</h2>
      
      {error && <div className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 p-3 rounded-md">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Image and Actions */}
        <div className="space-y-4">
            {renderImageState()}

            {isAiLoading && (
                <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-lg text-sm">
                    <div className="flex items-center gap-2 font-semibold text-indigo-700 dark:text-indigo-300 mb-2">
                        <SparklesIcon className="w-5 h-5 animate-pulse" />
                        <span>AI Analysis in Progress...</span>
                    </div>
                    <ul className="list-disc list-inside text-indigo-600 dark:text-indigo-400 space-y-1">
                        {aiProgress.map((step, i) => <li key={i}>{step}</li>)}
                    </ul>
                </div>
            )}

            <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={handleScanIngredients} disabled={!formData.image || isIngredientsLoading} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-700 disabled:bg-green-400 dark:disabled:bg-gray-600 transition-colors">
                    {isIngredientsLoading ? t('form.ingredients.loading') : t('form.button.scanIngredients')}
                </button>
                <button type="button" onClick={() => setIsScannerOpen(true)} disabled={!isBarcodeScannerEnabled} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-gray-600 transition-colors flex items-center justify-center gap-2">
                    <BarcodeIcon className="w-5 h-5" />
                    <span>{t('form.button.scanBarcode')}</span>
                </button>
            </div>
        </div>
        
        {/* Right Column: Form Fields */}
        <div className="space-y-4">
            <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={t('form.placeholder.name')}
                className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3"
            />
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.label.rating')}</label>
                <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map(star => (
                        <button type="button" key={star} onClick={() => handleRatingChange(star)} aria-label={t(star > 1 ? 'form.aria.ratePlural' : 'form.aria.rate', { star })}>
                            <StarIcon className={`w-8 h-8 cursor-pointer ${formData.rating >= star ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} filled={formData.rating >= star} />
                        </button>
                    ))}
                </div>
            </div>
             <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder={t('form.placeholder.notes')}
                rows={3}
                className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3"
            />
            <input
                type="text"
                value={tagInput}
                onChange={handleTagChange}
                placeholder={t('form.placeholder.tags')}
                className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3"
            />
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.label.nutriScore')}</label>
                <div className="flex gap-2">
                    {(['A', 'B', 'C', 'D', 'E'] as NutriScore[]).map(score => (
                        <button type="button" key={score} onClick={() => setFormData(prev => ({...prev, nutriScore: score}))} className={`w-8 h-8 rounded-full font-bold text-white text-sm transition-transform transform hover:scale-110 ${formData.nutriScore === score ? 'ring-2 ring-offset-2 dark:ring-offset-gray-800 ring-indigo-500' : ''} ${'bg-' + {A:'green-600',B:'lime-600',C:'yellow-500',D:'orange-500',E:'red-600'}[score]}`} aria-label={t('form.aria.selectNutriScore', {score})}>
                            {score}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      </div>
      
      {/* Ingredients & Dietary Section */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('form.ingredients.title')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('form.ingredients.ingredientsList')}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 h-24 overflow-y-auto bg-gray-100 dark:bg-gray-700/50 p-2 rounded-md">
                    {formData.ingredients && formData.ingredients.length > 0 ? formData.ingredients.join(', ') : t('form.ingredients.placeholder')}
                </p>
            </div>
            <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('form.dietary.title')}</h4>
                <div className="space-y-2">
                    {['isLactoseFree', 'isVegan', 'isGlutenFree'].map(key => (
                        <label key={key} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <input type="checkbox" name={key} checked={formData[key as keyof typeof formData] as boolean} onChange={handleCheckboxChange} className="rounded text-indigo-600 focus:ring-indigo-500" />
                            {t(`form.dietary.${key.substring(2).toLowerCase()}` as any)}
                        </label>
                    ))}
                </div>
            </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button type="button" onClick={onCancel} className="w-full sm:w-auto px-6 py-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-md font-semibold transition-colors">
          {t('form.button.cancel')}
        </button>
        <button type="submit" className="w-full sm:w-auto px-8 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition-colors">
          {initialData ? t('form.button.update') : t('form.button.save')}
        </button>
      </div>
      
      {isCameraOpen && <CameraCapture onCapture={handleCapture} onClose={() => setIsCameraOpen(false)} />}
      {isScannerOpen && <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setIsScannerOpen(false)} />}
      {imageToCrop && <ImageCropper imageUrl={imageToCrop} suggestedCrop={suggestedCrop} onCrop={handleCrop} onCancel={() => {setImageToCrop(null); setSuggestedCrop(null); setFormData(p=>({...p, image: imageToCrop}));}} />}
    </form>
  );
};
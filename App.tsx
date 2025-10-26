import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FoodItem } from './types';
import { FoodItemForm } from './components/FoodItemForm';
import { FoodItemList } from './components/FoodItemList';
import { FoodItemCard } from './components/FoodItemCard';
import { DuplicateConfirmationModal } from './components/DuplicateConfirmationModal';
import { ImageModal } from './components/ImageModal';
import { SettingsModal } from './components/SettingsModal';
import { ApiKeyBanner } from './components/ApiKeyBanner';
import { useTranslation } from './i18n/index';
import { PlusCircleIcon, SettingsIcon } from './components/Icons';

const hasValidApiKey = () => {
    const key = localStorage.getItem('gemini_api_key');
    return key && key !== 'MANUAL_ENTRY_MODE';
};

const App: React.FC = () => {
  const { t } = useTranslation();
  // This state now primarily tracks if a key exists to conditionally render AI features
  const [apiKey, setApiKey] = useState<string | null>(() => localStorage.getItem('gemini_api_key'));

  const [foodItems, setFoodItems] = useState<FoodItem[]>(() => {
    try {
      const savedItems = localStorage.getItem('foodItems');
      return savedItems ? JSON.parse(savedItems) : [];
    } catch (error) {
      console.error("Could not parse food items from localStorage", error);
      return [];
    }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'liked' | 'disliked' | 'all'>('all');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);

  const [potentialDuplicates, setPotentialDuplicates] = useState<FoodItem[]>([]);
  const [itemToAdd, setItemToAdd] = useState<Omit<FoodItem, 'id'> | null>(null);
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const [sharedItemToShow, setSharedItemToShow] = useState<Omit<FoodItem, 'id'> | null>(null);
  
  useEffect(() => {
    // Show banner if key is missing and it hasn't been dismissed this session
    if (!hasValidApiKey() && sessionStorage.getItem('apiKeyBannerDismissed') !== 'true') {
      setIsBannerVisible(true);
    }

    // Check for shared item data in URL
    const params = new URLSearchParams(window.location.search);
    const shareData = params.get('share');
    if (shareData) {
      try {
        // Robustly decode the Base64 string to a UTF-8 string
        const binaryString = atob(shareData);
        const utf8Bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          utf8Bytes[i] = binaryString.charCodeAt(i);
        }
        const jsonString = new TextDecoder().decode(utf8Bytes);
        
        const decodedItem: FoodItem = JSON.parse(jsonString);
        // Remove id to treat it as a new item. The rest of the data is preserved.
        const { id, ...itemData } = decodedItem;
        setSharedItemToShow(itemData);
      } catch (error) {
        console.error("Failed to parse shared item data from URL:", error);
      }
      // Clean the URL so the modal doesn't reappear on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);
  
  const handleDismissBanner = () => {
    sessionStorage.setItem('apiKeyBannerDismissed', 'true');
    setIsBannerVisible(false);
  };

  const handleKeyUpdate = useCallback((newKey: string | null) => {
    if (newKey) {
        localStorage.setItem('gemini_api_key', newKey);
    } else {
        localStorage.removeItem('gemini_api_key');
    }
    setApiKey(newKey);
    // If a valid key is added, hide the banner
    if (newKey && newKey !== 'MANUAL_ENTRY_MODE') {
      setIsBannerVisible(false);
    }
  }, []);


  useEffect(() => {
    localStorage.setItem('foodItems', JSON.stringify(foodItems));
  }, [foodItems]);

  const handleSaveItem = (itemData: Omit<FoodItem, 'id'>): void => {
    if (editingItem) {
        setFoodItems(prevItems =>
            prevItems.map(item =>
                item.id === editingItem.id ? { ...itemData, id: editingItem.id } : item
            )
        );
        handleCancelForm();
        return;
    }

    const duplicates = foodItems.filter(
      existingItem => existingItem.name.trim().toLowerCase() === itemData.name.trim().toLowerCase()
    );

    if (duplicates.length > 0) {
      setPotentialDuplicates(duplicates);
      setItemToAdd(itemData);
    } else {
      const newItem: FoodItem = {
        ...itemData,
        id: new Date().toISOString(),
      };
      setFoodItems(prevItems => [newItem, ...prevItems]);
      handleCancelForm();
    }
  };

  const handleAddSharedItem = () => {
    if (sharedItemToShow) {
      // Re-use the main save logic to handle duplicate checks as well
      handleSaveItem(sharedItemToShow);
      setSharedItemToShow(null); // This will close the shared item modal and the duplicate modal if it appears
    }
  };

  const handleStartEdit = (id: string) => {
    const itemToEdit = foodItems.find(item => item.id === id);
    if (itemToEdit) {
      setEditingItem(itemToEdit);
      setIsFormVisible(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const handleAddNewClick = () => {
    setEditingItem(null);
    setIsFormVisible(true);
  };
  
  const handleCancelForm = () => {
      setIsFormVisible(false);
      setEditingItem(null);
  };

  const handleDeleteItem = (id: string) => {
    setFoodItems(prevItems => prevItems.filter(item => item.id === id));
  };
  
  const handleConfirmDuplicateAdd = () => {
    if (itemToAdd) {
      const newItem: FoodItem = { ...itemToAdd, id: new Date().toISOString() };
      setFoodItems(prevItems => [newItem, ...prevItems]);
    }
    setItemToAdd(null);
    setPotentialDuplicates([]);
    handleCancelForm();
  };

  const handleCancelDuplicateAdd = () => {
    setItemToAdd(null);
    setPotentialDuplicates([]);
  };
  
  const filteredItems = useMemo(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return foodItems
      .filter(item => {
        if (filter === 'all') return true;
        if (filter === 'liked') return item.rating >= 4;
        if (filter === 'disliked') return item.rating <= 2 && item.rating > 0;
        return true;
      })
      .filter(item => 
        item.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        item.notes?.toLowerCase().includes(lowerCaseSearchTerm) ||
        item.tags?.join(' ').toLowerCase().includes(lowerCaseSearchTerm)
      );
  }, [foodItems, searchTerm, filter]);

  const isSearching = searchTerm.trim() !== '';

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans transition-colors duration-300">
      <header className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm shadow-md dark:shadow-lg sticky top-0 z-20">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-green-500 dark:from-indigo-400 dark:to-green-400">
                  {t('header.title')}
              </h1>
              <div className="flex items-center gap-2">
                  {!isFormVisible && (
                      <div className="hidden sm:flex items-center gap-2">
                          <input
                              type="text"
                              placeholder={t('header.searchPlaceholder')}
                              value={searchTerm}
                              onChange={e => setSearchTerm(e.target.value)}
                              className="w-48 bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-2"
                          />
                          <select
                              value={filter}
                              onChange={e => setFilter(e.target.value as 'liked' | 'disliked' | 'all')}
                              className="bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-2"
                          >
                              <option value="all">{t('header.filter.all')}</option>
                              <option value="liked">{t('header.filter.liked')}</option>
                              <option value="disliked">{t('header.filter.disliked')}</option>
                          </select>
                      </div>
                  )}
                  <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label={t('settings.title')}>
                      <SettingsIcon className="w-7 h-7 text-gray-600 dark:text-gray-300" />
                  </button>
              </div>
          </div>
          {!isFormVisible && (
              <div className="container mx-auto px-4 pb-4 sm:hidden">
                  <div className="flex flex-col gap-2">
                      <input
                          type="text"
                          placeholder={t('header.searchPlaceholder')}
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          className="w-full bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-2"
                      />
                      <select
                          value={filter}
                          onChange={e => setFilter(e.target.value as 'liked' | 'disliked' | 'all')}
                          className="w-full bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-2"
                      >
                          <option value="all">{t('header.filter.all')}</option>
                          <option value="liked">{t('header.filter.liked')}</option>
                          <option value="disliked">{t('header.filter.disliked')}</option>
                      </select>
                  </div>
              </div>
          )}
      </header>
      
      {isBannerVisible && <ApiKeyBanner onDismiss={handleDismissBanner} onOpenSettings={() => setIsSettingsOpen(true)} />}

      <main className="container mx-auto p-4 md:p-8">
        {isFormVisible ? (
            <FoodItemForm 
                onSaveItem={handleSaveItem} 
                onCancel={handleCancelForm}
                initialData={editingItem}
            />
        ) : (
            <div className="text-center mb-8">
                <button
                    onClick={handleAddNewClick}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-lg shadow-lg transition-transform transform hover:scale-105 flex items-center justify-center gap-3 mx-auto"
                >
                    <PlusCircleIcon className="w-8 h-8" />
                    <span className="text-xl">{t('form.addNewButton')}</span>
                </button>
            </div>
        )}
        
        {!isFormVisible && (
          <>
            {isSearching ? (
              <div className="my-8">
                <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                  {t('list.resultsFor', { searchTerm: searchTerm })}
                </h2>
              </div>
            ) : (
              foodItems.length > 0 && <div className="border-t border-gray-200 dark:border-gray-700 my-8"></div>
            )}
            <FoodItemList 
              items={filteredItems} 
              onDelete={handleDeleteItem} 
              onEdit={handleStartEdit}
              onImageClick={setSelectedImage} 
            />
          </>
        )}
      </main>
      
      <footer className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
        <p>{t('footer.text')}</p>
      </footer>

      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} onKeyUpdate={handleKeyUpdate} />}

      {potentialDuplicates.length > 0 && itemToAdd && (
        <DuplicateConfirmationModal
          items={potentialDuplicates}
          itemName={itemToAdd.name}
          onConfirm={handleConfirmDuplicateAdd}
          onCancel={handleCancelDuplicateAdd}
          onImageClick={setSelectedImage}
        />
      )}

      {sharedItemToShow && (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in" 
            onClick={() => setSharedItemToShow(null)}
            role="dialog"
            aria-modal="true"
        >
            <div className="relative bg-white dark:bg-gray-900 p-6 rounded-lg shadow-2xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('modal.shared.title')}</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{t('modal.shared.description')}</p>
                
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
                    <FoodItemCard
                        item={{ ...sharedItemToShow, id: 'shared-item-preview' }}
                        onDelete={() => {}}
                        onEdit={() => {}}
                        onImageClick={setSelectedImage}
                        isPreview={true}
                    />
                </div>

                <div className="mt-6 flex flex-col sm:flex-row justify-end gap-4 border-t border-gray-200 dark:border-gray-700 pt-6">
                <button
                    onClick={() => setSharedItemToShow(null)}
                    className="w-full sm:w-auto px-6 py-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-md font-semibold transition-colors"
                >
                    {t('modal.shared.close')}
                </button>
                <button
                    onClick={handleAddSharedItem}
                    className="w-full sm:w-auto px-8 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition-colors"
                >
                    {t('modal.shared.addToList')}
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
      )}

      {selectedImage && (
        <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
      )}
    </div>
  );
};

export default App;

import React, { useState, useEffect, useMemo } from 'react';
import { FoodItem, FoodItemType } from './types';
import { FoodItemForm } from './components/FoodItemForm';
import { FoodItemList } from './components/FoodItemList';
import { DuplicateConfirmationModal } from './components/DuplicateConfirmationModal';
import { ImageModal } from './components/ImageModal';
import { SettingsModal } from './components/SettingsModal';
import { SharedItemDetailView } from './components/SharedItemDetailView';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ApiKeyBanner } from './components/ApiKeyBanner';
import * as geminiService from './services/geminiService';
import { useTranslation } from './i18n/index';
import { PlusCircleIcon, SettingsIcon, ShoppingBagIcon, BuildingStorefrontIcon } from './components/Icons';

// Helper function to decode from URL-safe Base64 and decompress the data
const decodeAndDecompress = async (base64UrlString: string): Promise<any> => {
  // Convert URL-safe Base64 back to standard Base64
  let base64 = base64UrlString.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if necessary
  while (base64.length % 4) {
    base64 += '=';
  }
  
  // Decode from Base64 to a binary string
  const binaryString = atob(base64);
  // Convert the binary string to a Uint8Array
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  // Use the DecompressionStream API to gunzip the data
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  const decompressed = await new Response(stream).text();
  // Parse the resulting JSON string
  return JSON.parse(decompressed);
};


const App: React.FC = () => {
  const { t } = useTranslation();

  const [foodItems, setFoodItems] = useState<FoodItem[]>(() => {
    try {
      const savedItems = localStorage.getItem('foodItems');
      const parsedItems = savedItems ? JSON.parse(savedItems) : [];
      // Data migration for items created before itemType was introduced
      return parsedItems.map((item: any) => ({
          ...item,
          itemType: item.itemType || 'product', // Default to 'product'
      }));
    } catch (error) {
      console.error("Could not parse food items from localStorage", error);
      return [];
    }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<'liked' | 'disliked' | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'product' | 'dish'>('all');
  
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);

  const [potentialDuplicates, setPotentialDuplicates] = useState<FoodItem[]>([]);
  const [itemToAdd, setItemToAdd] = useState<Omit<FoodItem, 'id'> | null>(null);
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [sharedItemToShow, setSharedItemToShow] = useState<Omit<FoodItem, 'id'> | null>(null);

  const [hasValidApiKey, setHasValidApiKey] = useState<boolean | null>(null);
  const [isBannerDismissed, setIsBannerDismissed] = useState(() => sessionStorage.getItem('apiKeyBannerDismissed') === 'true');
  
  const [isItemTypeModalVisible, setIsItemTypeModalVisible] = useState(false);
  const [newItemType, setNewItemType] = useState<FoodItemType>('product');

  useEffect(() => {
    const keyExists = geminiService.hasValidApiKey();
    setHasValidApiKey(keyExists);
  }, []);
  
  useEffect(() => {
    // Check for shared item data in URL
    const params = new URLSearchParams(window.location.search);
    const shareData = params.get('s'); // 's' for 'share' (shortened)
    if (shareData) {
      const processShareData = async () => {
        try {
            const minified = await decodeAndDecompress(shareData);

            // Reconstruct the FoodItem from the minified object
            const reconstructedItem: Omit<FoodItem, 'id'> = {
                name: minified.n || '',
                rating: minified.r || 0,
                itemType: minified.it || 'product',
                notes: minified.no,
                tags: minified.t,
                // product specific
                nutriScore: minified.ns,
                ingredients: minified.i,
                allergens: minified.a,
                isLactoseFree: !!minified.lf,
                isVegan: !!minified.v,
                isGlutenFree: !!minified.gf,
                // dish specific
                restaurantName: minified.rn,
                cuisineType: minified.ct,
            };
            
            setSharedItemToShow(reconstructedItem);
        } catch (error) {
            console.error("Failed to parse shared item data from URL:", error);
        }
      };

      processShareData();
      // Clean the URL so the modal doesn't reappear on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('foodItems', JSON.stringify(foodItems));
  }, [foodItems]);

  const handleKeySave = (apiKey: string) => {
    geminiService.saveApiKey(apiKey);
    setHasValidApiKey(true);
  };

  const handleDismissBanner = () => {
    setIsBannerDismissed(true);
    sessionStorage.setItem('apiKeyBannerDismissed', 'true');
  };

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
    setIsItemTypeModalVisible(true);
  };

  const handleSelectType = (type: FoodItemType) => {
    setNewItemType(type);
    setIsItemTypeModalVisible(false);
    setIsFormVisible(true);
  };
  
  const handleCancelForm = () => {
      setIsFormVisible(false);
      setEditingItem(null);
  };

  const handleDeleteItem = (id: string) => {
    setFoodItems(prevItems => prevItems.filter(item => item.id !== id));
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
      .filter(item => { // Type filter
        if (typeFilter === 'all') return true;
        return item.itemType === typeFilter;
      })
      .filter(item => { // Rating filter
        if (ratingFilter === 'all') return true;
        if (ratingFilter === 'liked') return item.rating >= 4;
        if (ratingFilter === 'disliked') return item.rating <= 2 && item.rating > 0;
        return true;
      })
      .filter(item =>  // Search term filter
        item.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        item.notes?.toLowerCase().includes(lowerCaseSearchTerm) ||
        item.tags?.join(' ').toLowerCase().includes(lowerCaseSearchTerm) ||
        (item.itemType === 'dish' && (
            item.restaurantName?.toLowerCase().includes(lowerCaseSearchTerm) ||
            item.cuisineType?.toLowerCase().includes(lowerCaseSearchTerm)
        ))
      );
  }, [foodItems, searchTerm, ratingFilter, typeFilter]);

  const isSearching = searchTerm.trim() !== '';

  if (hasValidApiKey === null) {
    // Still loading the key status
    return null;
  }

  if (hasValidApiKey === false) {
    return <ApiKeyModal onKeySave={handleKeySave} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans transition-colors duration-300">
       {!hasValidApiKey && !isBannerDismissed && <ApiKeyBanner onDismiss={handleDismissBanner} onOpenSettings={() => setIsSettingsOpen(true)} />}
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
                              value={typeFilter}
                              onChange={e => setTypeFilter(e.target.value as any)}
                              className="bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-2"
                          >
                              <option value="all">{t('header.filter.type.all')}</option>
                              <option value="product">{t('header.filter.type.products')}</option>
                              <option value="dish">{t('header.filter.type.dishes')}</option>
                          </select>
                          <select
                              value={ratingFilter}
                              onChange={e => setRatingFilter(e.target.value as any)}
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
                      <div className="grid grid-cols-2 gap-2">
                        <select
                            value={typeFilter}
                            onChange={e => setTypeFilter(e.target.value as any)}
                            className="w-full bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-2"
                        >
                            <option value="all">{t('header.filter.type.all')}</option>
                            <option value="product">{t('header.filter.type.products')}</option>
                            <option value="dish">{t('header.filter.type.dishes')}</option>
                        </select>
                        <select
                            value={ratingFilter}
                            onChange={e => setRatingFilter(e.target.value as any)}
                            className="w-full bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-2"
                        >
                            <option value="all">{t('header.filter.all')}</option>
                            <option value="liked">{t('header.filter.liked')}</option>
                            <option value="disliked">{t('header.filter.disliked')}</option>
                        </select>
                      </div>
                  </div>
              </div>
          )}
      </header>
      
      <main className="container mx-auto p-4 md:p-8">
        {isFormVisible ? (
            <FoodItemForm 
                onSaveItem={handleSaveItem} 
                onCancel={handleCancelForm}
                initialData={editingItem}
                itemType={editingItem?.itemType || newItemType}
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

      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} hasValidApiKey={!!hasValidApiKey} setHasValidApiKey={setHasValidApiKey} />}

      {potentialDuplicates.length > 0 && itemToAdd && (
        <DuplicateConfirmationModal
          items={potentialDuplicates}
          itemName={itemToAdd.name}
          onConfirm={handleConfirmDuplicateAdd}
          onCancel={handleCancelDuplicateAdd}
          onImageClick={setSelectedImage}
        />
      )}

      {isItemTypeModalVisible && (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in" 
            onClick={() => setIsItemTypeModalVisible(false)}
            role="dialog" aria-modal="true"
        >
            <div className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-6">{t('modal.itemType.title')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onClick={() => handleSelectType('product')} className="flex flex-col items-center gap-3 p-6 bg-gray-100 dark:bg-gray-700/50 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:ring-2 hover:ring-indigo-500 transition-all">
                        <ShoppingBagIcon className="w-12 h-12 text-indigo-500 dark:text-indigo-400" />
                        <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('modal.itemType.product')}</span>
                    </button>
                     <button onClick={() => handleSelectType('dish')} className="flex flex-col items-center gap-3 p-6 bg-gray-100 dark:bg-gray-700/50 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 hover:ring-2 hover:ring-green-500 transition-all">
                        <BuildingStorefrontIcon className="w-12 h-12 text-green-500 dark:text-green-400" />
                        <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('modal.itemType.dish')}</span>
                    </button>
                </div>
            </div>
        </div>
      )}

      {sharedItemToShow && (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in" 
            onClick={() => setSharedItemToShow(null)}
            role="dialog"
            aria-modal="true"
        >
            <div className="relative bg-white dark:bg-gray-900 p-6 rounded-lg shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('modal.shared.title')}</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{t('modal.shared.description')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 italic -mt-2 mb-4">{t('modal.shared.summaryNotice')}</p>
                
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex-1 overflow-y-auto">
                    <SharedItemDetailView
                        item={sharedItemToShow}
                        onImageClick={setSelectedImage}
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
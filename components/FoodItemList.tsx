import React from 'react';
import { FoodItem } from '../types';
import { FoodItemCard } from './FoodItemCard';
import { useTranslation } from '../i18n';

interface FoodItemListProps {
  items: FoodItem[];
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onImageClick: (imageUrl: string) => void;
}

export const FoodItemList: React.FC<FoodItemListProps> = ({ items, onDelete, onEdit, onImageClick }) => {
  const { t } = useTranslation();

  if (items.length === 0) {
    return (
        <div className="text-center py-10 px-4">
            <h2 className="text-2xl font-semibold text-gray-600 dark:text-gray-400">{t('list.empty.title')}</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">{t('list.empty.description')}</p>
        </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map(item => (
        <FoodItemCard 
          key={item.id} 
          item={item} 
          onDelete={onDelete} 
          onEdit={onEdit}
          onImageClick={onImageClick}
        />
      ))}
    </div>
  );
};

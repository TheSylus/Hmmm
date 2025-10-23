import React from 'react';
import { FoodItem, NutriScore } from '../types';
import { StarIcon, TrashIcon, PencilIcon } from './Icons';
import { useTranslation } from '../i18n';

interface FoodItemCardProps {
  item: FoodItem;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onImageClick: (imageUrl: string) => void;
}

const nutriScoreColors: Record<NutriScore, string> = {
  A: 'bg-green-600',
  B: 'bg-lime-600',
  C: 'bg-yellow-500',
  D: 'bg-orange-500',
  E: 'bg-red-600',
};

export const FoodItemCard: React.FC<FoodItemCardProps> = ({ item, onDelete, onEdit, onImageClick }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg flex items-start p-4 gap-4 transition-all duration-300 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 relative">
      {/* Image Thumbnail */}
      {item.image && (
        <div 
          className="w-24 h-24 md:w-28 md:h-28 flex-shrink-0 rounded-md overflow-hidden cursor-pointer group"
          onClick={() => item.image && onImageClick(item.image)}
        >
          <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      )}

      {/* Details Section */}
      <div className="flex-1 flex flex-col justify-between self-stretch overflow-hidden">
        {/* Top part: Name, Rating, Notes */}
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate pr-20" title={item.name}>{item.name}</h3>
          
          <div className="flex items-center my-1.5">
              {[1, 2, 3, 4, 5].map(star => (
                <StarIcon key={star} className={`w-5 h-5 ${item.rating >= star ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} filled={item.rating >= star} />
              ))}
              {item.nutriScore && (
                <div className={`ml-3 text-xs w-6 h-6 rounded-full text-white font-bold flex items-center justify-center flex-shrink-0 ${nutriScoreColors[item.nutriScore]}`}>
                  {item.nutriScore}
                </div>
              )}
          </div>

          {item.notes && (
            <p className="text-gray-600 dark:text-gray-400 text-sm max-h-10 overflow-hidden leading-tight">{item.notes}</p>
          )}
        </div>

        {/* Bottom part: Horizontally Scrolling Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pt-2 mt-auto scrollbar-hide">
            {item.tags.map(tag => (
              <span key={tag} className="flex-shrink-0 bg-indigo-100 text-indigo-800 dark:bg-indigo-600 dark:text-indigo-100 text-xs font-semibold px-2 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(item.id); }}
            className="text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors"
            aria-label={t('card.editAria', { name: item.name })}
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
            className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors"
            aria-label={t('card.deleteAria', { name: item.name })}
          >
            <TrashIcon className="w-5 h-5" />
          </button>
      </div>


      {/* Custom scrollbar styling */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
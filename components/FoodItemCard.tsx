import React from 'react';
import { FoodItem, NutriScore } from '../types';
import { StarIcon, TrashIcon, PencilIcon, LactoseFreeIcon, VeganIcon, GlutenFreeIcon } from './Icons';
import { useTranslation } from '../i18n';
import { useTranslatedItem } from '../hooks/useTranslatedItem';

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
  const displayItem = useTranslatedItem(item);

  if (!displayItem) {
    return null; // Render nothing if the item is not available
  }

  const DietaryIcon: React.FC<{ type: 'lactoseFree' | 'vegan' | 'glutenFree', className?: string }> = ({ type, className }) => {
      const icons = {
          lactoseFree: <LactoseFreeIcon className={`${className} text-blue-600 dark:text-blue-400`} />,
          vegan: <VeganIcon className={`${className}`} />,
          glutenFree: <GlutenFreeIcon className={`${className}`} />,
      };
      const tooltips = {
          lactoseFree: t('card.lactoseFreeTooltip'),
          vegan: t('card.veganTooltip'),
          glutenFree: t('card.glutenFreeTooltip'),
      };
      return (
          <div className="relative group flex items-center justify-center">
              {icons[type]}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {tooltips[type]}
              </span>
          </div>
      );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg flex flex-col p-4 gap-4 transition-all duration-300 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 relative">
        <div className="flex items-start gap-4">
            {/* Image Thumbnail */}
            {displayItem.image && (
                <div 
                className="w-24 h-24 md:w-28 md:h-28 flex-shrink-0 rounded-md overflow-hidden cursor-pointer group"
                onClick={() => displayItem.image && onImageClick(displayItem.image)}
                >
                <img src={displayItem.image} alt={displayItem.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
            )}

            {/* Details Section */}
            <div className="flex-1 flex flex-col justify-between self-stretch overflow-hidden">
                {/* Top part: Name, Rating, Notes */}
                <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate pr-20" title={displayItem.name}>{displayItem.name}</h3>
                
                <div className="flex items-center my-1.5">
                    {[1, 2, 3, 4, 5].map(star => (
                        <StarIcon key={star} className={`w-5 h-5 ${displayItem.rating >= star ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} filled={displayItem.rating >= star} />
                    ))}
                    
                    <div className="ml-3 flex items-center gap-2">
                        {displayItem.nutriScore && (
                            <div className={`text-xs w-6 h-6 rounded-full text-white font-bold flex items-center justify-center flex-shrink-0 ${nutriScoreColors[displayItem.nutriScore]}`}>
                            {displayItem.nutriScore}
                            </div>
                        )}
                         <div className="flex items-center gap-1.5">
                            {displayItem.isLactoseFree && <DietaryIcon type="lactoseFree" className="w-6 h-6" />}
                            {displayItem.isVegan && <DietaryIcon type="vegan" className="w-6 h-6" />}
                            {displayItem.isGlutenFree && <DietaryIcon type="glutenFree" className="w-6 h-6" />}
                        </div>
                    </div>
                </div>

                {displayItem.notes && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm max-h-10 overflow-hidden leading-tight">{displayItem.notes}</p>
                )}
                </div>

                {/* Bottom part: Horizontally Scrolling Tags */}
                {displayItem.tags && displayItem.tags.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pt-2 mt-auto scrollbar-hide">
                    {displayItem.tags.map(tag => (
                    <span key={tag} className="flex-shrink-0 bg-indigo-100 text-indigo-800 dark:bg-indigo-600 dark:text-indigo-100 text-xs font-semibold px-2 py-1 rounded-full">
                        {tag}
                    </span>
                    ))}
                </div>
                )}
            </div>
        </div>

      {/* Action Buttons */}
      <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(item.id); }}
            className="text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors"
            aria-label={t('card.editAria', { name: displayItem.name })}
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
            className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors"
            aria-label={t('card.deleteAria', { name: displayItem.name })}
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
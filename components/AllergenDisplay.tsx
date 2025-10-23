import React from 'react';
import { useTranslation } from '../i18n';
import {
  GlutenIcon, DairyIcon, PeanutIcon, TreeNutIcon, SoyIcon, EggIcon, FishIcon, ShellfishIcon
} from './Icons';

interface AllergenDisplayProps {
  allergens: string[];
}

interface AllergenMap {
  keywords: string[];
  Icon: React.FC<{ className?: string }>;
  tooltipKey: string;
}

const allergenMap: AllergenMap[] = [
  { keywords: ['gluten', 'wheat', 'barley', 'rye', 'weizen', 'gerste', 'roggen'], Icon: GlutenIcon, tooltipKey: 'allergen.gluten' },
  { keywords: ['milk', 'dairy', 'lactose', 'casein', 'whey', 'milch', 'laktose', 'molke'], Icon: DairyIcon, tooltipKey: 'allergen.dairy' },
  { keywords: ['peanut', 'peanuts', 'erdnuss', 'erdnüsse'], Icon: PeanutIcon, tooltipKey: 'allergen.peanuts' },
  { keywords: ['tree nut', 'nuts', 'almond', 'walnut', 'cashew', 'pecan', 'schalenfrüchte', 'nüsse', 'mandel', 'walnuss'], Icon: TreeNutIcon, tooltipKey: 'allergen.tree_nuts' },
  { keywords: ['soy', 'soya', 'soja'], Icon: SoyIcon, tooltipKey: 'allergen.soy' },
  { keywords: ['egg', 'eggs', 'ei', 'eier'], Icon: EggIcon, tooltipKey: 'allergen.eggs' },
  { keywords: ['fish', 'fisch'], Icon: FishIcon, tooltipKey: 'allergen.fish' },
  { keywords: ['shellfish', 'crustacean', 'mollusc', 'schalentiere', 'krebstiere', 'weichtiere'], Icon: ShellfishIcon, tooltipKey: 'allergen.shellfish' },
];

export const AllergenDisplay: React.FC<AllergenDisplayProps> = ({ allergens }) => {
    const { t } = useTranslation();

    const getIconFor = (allergen: string) => {
        const lowerAllergen = allergen.toLowerCase();
        return allergenMap.find(item => item.keywords.some(kw => lowerAllergen.includes(kw)));
    };

    const renderedIcons = new Set<string>();
    const unknownAllergens: string[] = [];

    allergens.forEach(allergen => {
        const mapping = getIconFor(allergen);
        if (mapping && !renderedIcons.has(mapping.tooltipKey)) {
            renderedIcons.add(mapping.tooltipKey);
        } else if (!mapping) {
            unknownAllergens.push(allergen);
        }
    });

    return (
        <div className="flex flex-wrap items-center gap-2">
            {Array.from(renderedIcons).map(tooltipKey => {
                const mapping = allergenMap.find(m => m.tooltipKey === tooltipKey);
                if (!mapping) return null;
                const { Icon } = mapping;
                return (
                    <div key={tooltipKey} className="relative group">
                        <Icon className="w-6 h-6 text-red-600 dark:text-red-400" />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            {t(tooltipKey)}
                        </span>
                    </div>
                );
            })}
            {unknownAllergens.map((allergen) => (
                <span key={allergen} className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 text-xs font-semibold px-2 py-1 rounded-full">
                    {allergen}
                </span>
            ))}
        </div>
    );
};
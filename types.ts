export type NutriScore = 'A' | 'B' | 'C' | 'D' | 'E';

export interface FoodItem {
  id: string;
  name: string;
  rating: number; // 0 for unrated, 1-5 for star rating
  notes?: string;
  image?: string; // Base64 encoded image
  nutriScore?: NutriScore;
  tags?: string[];
  ingredients?: string[];
  allergens?: string[];
  isLactoseFree?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
}
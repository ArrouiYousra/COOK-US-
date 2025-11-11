export interface CookFilters {
  location: string;
  specialties: string[];
  minBudget: number;
  maxBudget: number;
  minRating: number;
  availability: string[];
  coordinates?: {
    lat: number;
    lng: number;
  } | null;
}



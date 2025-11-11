import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine les classes Tailwind de manière sûre
 * Utilisé pour gérer les conflits de classes CSS
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formate un prix en euros
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(price);
}

/**
 * Formate une date en français
 */
export function formatDate(date: string | Date | null | undefined): string {
  // Gérer les valeurs nulles ou undefined
  if (!date) {
    return "Date non définie";
  }

  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Vérifier si la date est valide
    if (isNaN(dateObj.getTime())) {
      console.warn("Date invalide:", date);
      return "Date invalide";
    }

    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(dateObj);
  } catch (error) {
    console.error("Erreur lors du formatage de la date:", error, date);
    return "Date invalide";
  }
}

/**
 * Formate une date avec l'heure
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  // Gérer les valeurs nulles ou undefined
  if (!date) {
    return "Date non définie";
  }

  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Vérifier si la date est valide
    if (isNaN(dateObj.getTime())) {
      console.warn("Date invalide:", date);
      return "Date invalide";
    }

    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObj);
  } catch (error) {
    console.error("Erreur lors du formatage de la date:", error, date);
    return "Date invalide";
  }
}

/**
 * Calcule la distance entre deux points GPS (formule de Haversine)
 * Retourne la distance en kilomètres
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Génère une URL d'image optimisée pour Supabase Storage
 */
export function getImageUrl(bucket: string, path: string): string {
  // À remplacer par votre URL Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

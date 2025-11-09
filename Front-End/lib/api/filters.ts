/**
 * API client pour la gestion des filtres sauvegardés
 * Utilise JWT token pour l'authentification
 */

import { apiClient } from "./client";

export interface SavedFilter {
  id: string;
  name: string;
  filters: {
    location: string;
    specialties: string[];
    minBudget: number;
    maxBudget: number;
    minRating: number;
    availability: string[];
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Récupère tous les filtres sauvegardés de l'utilisateur
 */
export async function getSavedFilters(): Promise<SavedFilter[]> {
  const response = await apiClient.client.get<SavedFilter[]>("/client/filters");
  return response.data;
}

/**
 * Sauvegarde un nouveau filtre
 */
export async function saveFilter(data: {
  name: string;
  filters: SavedFilter["filters"];
}): Promise<SavedFilter> {
  const response = await apiClient.client.post<SavedFilter>("/client/filters", data);
  return response.data;
}

/**
 * Supprime un filtre sauvegardé
 */
export async function deleteFilter(filterId: string): Promise<void> {
  await apiClient.client.delete(`/client/filters/${filterId}`);
}

/**
 * Met à jour un filtre sauvegardé
 */
export async function updateFilter(
  filterId: string,
  data: {
    name?: string;
    filters?: SavedFilter["filters"];
  }
): Promise<SavedFilter> {
  const response = await apiClient.client.patch<SavedFilter>(
    `/client/filters/${filterId}`,
    data
  );
  return response.data;
}


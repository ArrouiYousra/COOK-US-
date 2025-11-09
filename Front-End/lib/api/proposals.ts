/**
 * API client pour la gestion des propositions
 * Gère les propositions directes du client aux cuisiniers
 */

import type { ClientProposal } from "@/types";
import { apiClient } from "./client";

/**
 * Crée une proposition directe du client au cuisinier
 */
export async function createProposal(data: {
  cookId: string;
  date: string;
  timeSlot: string;
  numberOfGuests: number;
  budget: number;
  address: string;
  description: string;
  specialRequests?: string;
}): Promise<ClientProposal> {
  const response = await apiClient.client.post<ClientProposal>("/proposals", data);
  return response.data;
}

/**
 * Accepte une proposition (côté cuisinier)
 * Débloque automatiquement les messages et crée un booking en payment_pending
 */
export async function acceptProposal(
  proposalId: string
): Promise<{
  proposal: ClientProposal;
  bookingId: string;
  conversationId: string;
}> {
  const response = await apiClient.client.post<{
    proposal: ClientProposal;
    bookingId: string;
    conversationId: string;
  }>(`/proposals/${proposalId}/accept`, {});
  return response.data;
}

/**
 * Refuse une proposition (côté cuisinier)
 */
export async function rejectProposal(proposalId: string): Promise<ClientProposal> {
  const response = await apiClient.client.post<ClientProposal>(
    `/proposals/${proposalId}/reject`,
    {}
  );
  return response.data;
}

/**
 * Récupère toutes les propositions d'un client
 */
export async function getClientProposals(): Promise<ClientProposal[]> {
  const response = await apiClient.client.get<ClientProposal[]>("/proposals/client");
  return response.data;
}

/**
 * Récupère toutes les propositions reçues par un cuisinier
 */
export async function getCookProposals(): Promise<ClientProposal[]> {
  const response = await apiClient.client.get<ClientProposal[]>("/proposals/cook");
  return response.data;
}


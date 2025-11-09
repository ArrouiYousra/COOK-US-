/**
 * API client pour la gestion des conversations
 * Gère le déblocage automatique des messages après acceptation
 */

import { apiClient } from "./client";

export interface Conversation {
  id: string;
  cookId: string;
  clientId: string;
  proposalId?: string;
  bookingId?: string;
  requestId?: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Crée automatiquement une conversation après acceptation d'une proposition
 * Cette fonction est appelée automatiquement par le backend lors de l'acceptation
 */
export async function createConversationAfterProposalAcceptance(data: {
  proposalId: string;
  cookId: string;
  clientId: string;
}): Promise<Conversation> {
  const response = await apiClient.client.post<Conversation>(
    "/conversations/from-proposal",
    data
  );
  return response.data;
}

/**
 * Crée une conversation après acceptation d'une proposition sur une demande publique
 */
export async function createConversationAfterRequestAcceptance(data: {
  requestId: string;
  proposalId: string;
  cookId: string;
  clientId: string;
}): Promise<Conversation> {
  const response = await apiClient.client.post<Conversation>(
    "/conversations/from-request",
    data
  );
  return response.data;
}

/**
 * Vérifie si une conversation existe pour un cuisinier et un client
 */
export async function getConversation(
  cookId: string,
  clientId: string
): Promise<Conversation | null> {
  try {
    const response = await apiClient.client.get<Conversation>(
      `/conversations?cookId=${cookId}&clientId=${clientId}`
    );
    return response.data;
  } catch (error) {
    return null;
  }
}

/**
 * Récupère toutes les conversations d'un client
 */
export async function getClientConversations(): Promise<Conversation[]> {
  const response = await apiClient.client.get<Conversation[]>("/conversations/client");
  return response.data;
}


/**
 * API client pour la gestion des réservations
 * Gère les deux flux : demande publique et proposition directe
 */

import type { Booking } from "@/types";
import { apiClient } from "./client";

/**
 * Crée un booking depuis une proposition acceptée (Flux 2)
 * Le booking est créé avec le statut "payment_pending"
 */
export async function createBookingFromProposal(data: {
  proposalId: string;
  cookId: string;
  clientId: string;
  date: string;
  time: string;
  numberOfGuests: number;
  totalPrice: number;
  specialRequests?: string;
}): Promise<Booking> {
  const response = await apiClient.client.post<Booking>(
    "/bookings/from-proposal",
    data
  );
  return response.data;
}

/**
 * Crée un booking depuis une demande publique acceptée (Flux 1)
 */
export async function createBookingFromRequest(data: {
  requestId: string;
  proposalId: string;
  cookId: string;
  clientId: string;
  date: string;
  time: string;
  numberOfGuests: number;
  totalPrice: number;
  specialRequests?: string;
}): Promise<Booking> {
  const response = await apiClient.client.post<Booking>(
    "/bookings/from-request",
    data
  );
  return response.data;
}

/**
 * Met à jour le statut d'un booking après paiement
 * payment_pending → confirmed
 */
export async function confirmBookingAfterPayment(
  bookingId: string,
  paymentIntentId: string
): Promise<Booking> {
  const response = await apiClient.client.post<Booking>(
    `/bookings/${bookingId}/confirm-payment`,
    { paymentIntentId }
  );
  return response.data;
}

/**
 * Récupère un booking par ID
 */
export async function getBooking(bookingId: string): Promise<Booking> {
  const response = await apiClient.client.get<Booking>(`/bookings/${bookingId}`);
  return response.data;
}

/**
 * Récupère tous les bookings d'un client
 */
export async function getClientBookings(): Promise<Booking[]> {
  const response = await apiClient.client.get<Booking[]>("/bookings/client");
  return response.data;
}


// Types principaux pour COOK US

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Cook extends User {
  siret?: string;
  bio: string;
  dishes: Dish[];
  rating: number;
  reviewCount: number;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    zipCode: string;
  };
  specialties: string[];
  pricePerPerson: number;
  maxGuests: number;
  documents?: {
    siretUrl?: string;
    identityUrl?: string;
  };
}

export interface Dish {
  id: string;
  cookId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  category: string;
  allergens?: string[];
}

// Statuts de réservation étendus pour gérer les deux flux
export type BookingStatus = 
  | "proposition_pending"    // Proposition envoyée par le client, en attente d'acceptation du cuisinier
  | "proposition_accepted"    // Proposition acceptée par le cuisinier, messages débloqués
  | "payment_pending"         // Proposition acceptée, en attente de paiement
  | "confirmed"               // Paiement effectué, réservation confirmée
  | "pending"                 // Ancien flux : demande publique, en attente de propositions
  | "done"                    // Réservation terminée
  | "cancelled"               // Réservation annulée
  | "PENDING"                  // Variante majuscule
  | "CONFIRMED"                // Variante majuscule
  | "ACCEPTED"                 // Variante majuscule
  | "COMPLETED";               // Variante majuscule

export interface Booking {
  id: string;
  cookId: string;
  userId: string;
  date: string;
  time: string;
  numberOfGuests: number;
  status: BookingStatus;
  totalPrice: number;
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
  // Nouveaux champs pour gérer les deux flux
  requestId?: string;         // ID de la demande publique (si flux 1)
  proposalId?: string;        // ID de la proposition directe (si flux 2)
  paymentStatus?: "pending" | "completed" | "failed";
  paymentIntentId?: string;
  conversationId?: string;    // ID de la conversation débloquée après acceptation
  // Propriétés alternatives utilisées par l'API (snake_case)
  booking_date?: string;
  cook_profile_id?: string;
  start_time?: string;
  end_time?: string;
  number_of_guests?: number;
  total_price?: number;
  special_requests?: string;
  budget?: number;
  // Propriétés pour les rappels
  reminder24hSent?: boolean;
  reminder1hSent?: boolean;
  cookName?: string;
}

// Proposition directe du client au cuisinier (Flux 2)
export interface ClientProposal {
  id: string;
  cookId: string;
  clientId: string;
  date: string;
  timeSlot: string;
  numberOfGuests: number;
  budget: number;
  address: string;
  description: string;
  specialRequests?: string;
  status: "pending" | "accepted" | "rejected" | "expired";
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
  // Après acceptation
  bookingId?: string;
  conversationId?: string;
}

// Réservation (Proposition d'un cuisinier sur une demande publique)
export type ReservationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';

export interface Reservation {
  id: string;
  booking_id: string; // ID de la demande publique
  cook_profile_id: string; // ID du profil cuisinier
  status: ReservationStatus;
  proposed_price: number; // Prix total proposé
  proposed_hours?: number | null; // Nombre d'heures proposées
  proposed_hourly_rate?: number | null; // Tarif horaire proposé
  message?: string | null; // Message personnalisé du cuisinier
  can_do_groceries: boolean;
  can_set_table: boolean;
  can_do_dishes: boolean;
  expires_at?: string | null; // Date d'expiration (72h)
  accepted_at?: string | null;
  rejected_at?: string | null;
  cancelled_at?: string | null;
  rejection_reason?: string | null;
  cancellation_reason?: string | null;
  created_at: string;
  updated_at: string;
  // Données enrichies (optionnel)
  cook?: {
    id: string;
    headline: string;
    bio?: string;
    hourly_rate: number;
    average_rating?: number;
    user?: {
      first_name: string;
      last_name: string;
      avatar_url?: string;
    };
  };
}

export interface CreateReservationDTO {
  booking_id: string;
  proposed_price: number;
  proposed_hours?: number;
  proposed_hourly_rate?: number;
  message?: string;
  can_do_groceries?: boolean;
  can_set_table?: boolean;
  can_do_dishes?: boolean;
}

export interface ReservationStats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  cancelled: number;
  expired: number;
}

export interface Review {
  id: string;
  bookingId: string;
  cookId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface SearchFilters {
  location?: {
    latitude: number;
    longitude: number;
    radius?: number; // en km
  };
  numberOfGuests?: number;
  maxPrice?: number;
  minRating?: number;
  specialties?: string[];
  date?: string;
}

export type UserRole = "CLIENT" | "COOK" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "DELETED" | "PENDING_VERIFICATION";

// Types d'authentification
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  phone?: string;
  emailVerified?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: AuthUser;
  token?: string;
  refreshToken?: string;
}

export interface RegisterClientInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface RegisterCookInput {
  // Champs de base
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  // Champs cuisinier
  employmentStatus: "AUTO_ENTREPRENEUR" | "PORTAGE_SALARIAL" | "MICRO_ENTREPRISE" | "ASSOCIATION";
  headline: string;
  hourlyRate: number;
  siretNumber?: string;
  // Champs PORTAGE_SALARIAL
  birthPlace?: string;
  socialSecurityNumber?: string;
  iban?: string;
  bic?: string;
  ribDocument?: string;
  ribDocumentName?: string;
}

// Types pour les réponses API
export interface ClientProfile {
  id: string;
  user_id: string;
  household_size: number | null;
  pet_friendly: boolean;
  smoking_allowed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CookProfile {
  id: string;
  user_id: string;
  status: string;
  headline: string;
  bio: string | null;
  experience: string | null;
  video_intro_url: string | null;
  service_radius: number;
  hourly_rate: number;
  minimum_booking_hours: number;
  can_do_groceries: boolean;
  can_set_table: boolean;
  can_do_dishes: boolean;
  max_guests: number;
  employment_status: string;
  siret_number: string | null;
  insurance_number: string | null;
  insurance_expiry_date: string | null;
  id_card_url: string | null;
  insurance_cert_url: string | null;
  kbis_url: string | null;
  is_available: boolean;
  availability_note: string | null;
  average_rating: number | null;
  total_bookings: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  user: AuthUser;
  cookProfile?: CookProfile | null;
  clientProfile?: ClientProfile | null;
}

export interface BookingResponse {
  bookings: Booking[];
  count: number;
  limit?: number;
  offset?: number;
}

export interface ProposalsResponse {
  bookings: Booking[];
  count: number;
  stats: {
    pending: number;
    accepted: number;
    rejected: number;
  };
  filter: "all" | "pending" | "accepted" | "rejected";
  limit: number;
  offset: number;
}

export interface GetBookingsParams {
  status?: string;
  limit?: number;
  offset?: number;
}

export interface GetMyProposalsParams {
  filter?: "pending" | "accepted" | "rejected";
  limit?: number;
  offset?: number;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  password: string;
  confirmPassword: string;
  token: string;
}

export interface AuthState {
  user: AuthUser | null;
  refreshToken?: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface BookingState {
  bookings: Booking[];
  isLoading: boolean;
  error: string | null;
}

export interface FilterState {
  filters: SearchFilters;
  activeFilters: Partial<SearchFilters>;
}


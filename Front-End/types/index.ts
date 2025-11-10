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
  | "cancelled";              // Réservation annulée

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
  hourly_rate: number;
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



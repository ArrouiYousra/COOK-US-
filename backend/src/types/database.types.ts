// ENUMs
export type UserRole = 'CLIENT' | 'COOK' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED' | 'PENDING_VERIFICATION';
export type CookStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'PAUSED' | 'SUSPENDED' | 'REJECTED';
export type EmploymentStatus = 'AUTO_ENTREPRENEUR' | 'PORTAGE_SALARIAL' | 'MICRO_ENTREPRISE' | 'ASSOCIATION';
export type BookingStatus = 'PENDING' | 'ACCEPTED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';

// User table
export interface User {
  id: string;
  email: string;
  email_verified: string | null;
  password: string;
  phone: string | null;
  phone_verified: string | null;
  role: UserRole;
  status: UserStatus;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  date_of_birth: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string;
  location: unknown | null; // PostGIS POINT
  language: string;
  currency: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  two_factor_enabled: boolean;
  two_factor_secret: string | null;
  last_login_at: string | null;
  last_login_ip: string | null;
  created_at: string;
  updated_at: string;
}

// Cook Profile table
export interface CookProfile {
  id: string;
  user_id: string;
  status: CookStatus;
  headline: string;
  bio: string | null;
  experience: string | null;
  video_intro_url: string | null;
  service_radius: number;
  location: unknown | null; // PostGIS POINT
  hourly_rate: number;
  minimum_booking_hours: number;
  can_do_groceries: boolean;
  can_set_table: boolean;
  can_do_dishes: boolean;
  max_guests: number;
  employment_status: EmploymentStatus;
  siret_number: string | null;
  siret_verified: boolean;
  siret_verified_at: string | null;
  insurance_number: string | null;
  insurance_expiry_date: string | null;
  id_card_url: string | null;
  insurance_cert_url: string | null;
  kbis_url: string | null;
  is_available: boolean;
  availability_note: string | null;
  total_bookings: number;
  total_earnings: number;
  average_rating: number | null;
  response_rate: number | null;
  response_time: number | null;
  is_verified: boolean;
  is_super_cook: boolean;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

// Client Profile table
export interface ClientProfile {
  id: string;
  user_id: string;
  household_size: number | null;
  pet_friendly: boolean;
  smoking_allowed: boolean;
  total_bookings: number;
  total_spent: number;
  average_rating_given: number | null;
  created_at: string;
  updated_at: string;
}

// DTOs for creating users
export interface CreateUserDTO {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: UserRole;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
}

export interface CreateCookProfileDTO {
  user_id: string;
  headline: string;
  hourly_rate: number;
  employment_status: EmploymentStatus;
  bio?: string;
  service_radius?: number;
  minimum_booking_hours?: number;
}

export interface CreateClientProfileDTO {
  user_id: string;
  household_size?: number;
}

// Booking table
export interface Booking {
  id: string;
  client_id: string;
  cook_id: string;
  status: BookingStatus;
  service_date: string; // Date/heure du service
  service_duration_hours: number;
  number_of_guests: number;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  location: unknown | null; // PostGIS POINT
  special_requests: string | null;
  dietary_restrictions: string | null;
  pantry_items: string | null; // Ce que le client a dans son frigo/garde-manger
  menu_description: string | null;
  total_price: number;
  hourly_rate: number;
  can_do_groceries: boolean;
  can_set_table: boolean;
  can_do_dishes: boolean;
  client_accepted: boolean;
  cook_accepted: boolean;
  client_accepted_at: string | null;
  cook_accepted_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null; // 'CLIENT' | 'COOK'
  cancellation_reason: string | null;
  completed_at: string | null;
  payment_status: string; // 'PENDING' | 'PAID' | 'REFUNDED'
  payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
}

// DTOs for creating bookings
export interface CreateBookingDTO {
  cook_id: string;
  service_date: string;
  service_duration_hours: number;
  number_of_guests: number;
  address: string;
  city: string;
  postal_code: string;
  country?: string;
  special_requests?: string;
  dietary_restrictions?: string;
  pantry_items?: string;
  menu_description?: string;
  can_do_groceries?: boolean;
  can_set_table?: boolean;
  can_do_dishes?: boolean;
}


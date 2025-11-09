// ENUMs
export type UserRole = 'CLIENT' | 'COOK' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED' | 'PENDING_VERIFICATION';
export type CookStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'PAUSED' | 'SUSPENDED' | 'REJECTED';
export type EmploymentStatus = 'AUTO_ENTREPRENEUR' | 'PORTAGE_SALARIAL' | 'MICRO_ENTREPRISE' | 'ASSOCIATION';
export type BookingStatus = 'PENDING' | 'ACCEPTED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
export type CancellationReason = 'CLIENT_REQUEST' | 'COOK_UNAVAILABLE' | 'EMERGENCY' | 'WEATHER' | 'OTHER';
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'BRUNCH';
export type DietaryRestriction = 'VEGETARIAN' | 'VEGAN' | 'GLUTEN_FREE' | 'LACTOSE_FREE' | 'HALAL' | 'KOSHER' | 'LOW_CARB' | 'KETO' | 'PALEO' | 'DIABETIC';
export type Allergy = 'PEANUTS' | 'TREE_NUTS' | 'MILK' | 'EGGS' | 'FISH' | 'SHELLFISH' | 'SOY' | 'WHEAT' | 'SESAME' | 'MUSTARD' | 'CELERY' | 'LUPIN' | 'SULFITES';

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

// Booking table (according to SQL schema)
export interface Booking {
  id: string;
  client_profile_id: string;
  cook_profile_id: string;
  booking_date: string; // DATE
  meal_type: MealType | null;
  start_time: string | null; // TIME
  end_time: string | null; // TIME
  number_of_guests: number | null;
  status: BookingStatus;
  need_groceries: boolean;
  need_table_setting: boolean;
  need_dishes: boolean;
  dietary_restrictions: DietaryRestriction[] | null;
  allergies: Allergy[] | null;
  special_requests: string | null;
  ingredients_available: string | null;
  hourly_rate: number | null;
  hours_booked: number | null;
  extra_services_price: number;
  subtotal: number | null;
  platform_fee: number | null;
  total_price: number | null;
  cook_earnings: number | null;
  payment_intent_id: string | null;
  payment_status: string | null;
  paid_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null; // UUID
  cancellation_reason: CancellationReason | null;
  cancellation_note: string | null;
  refund_amount: number | null;
  refunded_at: string | null;
  completed_at: string | null;
  review_deadline: string | null;
  created_at: string;
  updated_at: string;
}

// Reservation Status ENUM
export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

// Reservations table (for cooks to apply to public bookings)
export interface Reservation {
  id: string;
  booking_id: string;
  user_id: string; // Cook user_id
  status: ReservationStatus;
  created_at: string;
}

// DTOs for creating bookings
export interface CreateBookingDTO {
  cook_profile_id?: string | null; // Optional - null for public requests
  booking_date: string; // DATE format YYYY-MM-DD
  meal_type?: MealType;
  start_time?: string; // TIME format HH:MM:SS
  end_time?: string; // TIME format HH:MM:SS
  number_of_guests?: number;
  need_groceries?: boolean;
  need_table_setting?: boolean;
  need_dishes?: boolean;
  dietary_restrictions?: DietaryRestriction[];
  allergies?: Allergy[];
  special_requests?: string;
  ingredients_available?: string;
  address_id?: string; // Reference to addresses table
}

// Message/Conversation tables (according to SQL schema)
export interface Conversation {
  id: string;
  booking_id: string | null; // Optional, links to booking
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  last_read_at: string | null;
  unread_count: number;
}

export type MessageType = 'TEXT' | 'IMAGE' | 'SYSTEM';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  type: MessageType;
  content: string | null;
  attachment_url: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

// DTOs for creating messages
export interface CreateMessageDTO {
  recipient_id: string;
  content: string;
  message_type?: MessageType;
  attachment_url?: string;
  booking_id?: string; // Optional, to link conversation to booking
}

// Reviews table
export interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string; // User who wrote the review
  reviewee_id: string; // User being reviewed
  rating: number; // 0 to 5
  comment: string | null;
  created_at: string;
  updated_at: string;
}

// DTOs for creating reviews
export interface CreateReviewDTO {
  booking_id: string;
  rating: number; // 0 to 5
  comment?: string;
}


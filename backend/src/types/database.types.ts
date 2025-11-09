// ENUMs
export type UserRole = 'CLIENT' | 'COOK' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED' | 'PENDING_VERIFICATION';
export type CookStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'PAUSED' | 'SUSPENDED' | 'REJECTED';
export type EmploymentStatus = 'AUTO_ENTREPRENEUR' | 'PORTAGE_SALARIAL' | 'MICRO_ENTREPRISE' | 'ASSOCIATION';
export type BookingStatus = 'PENDING' | 'ACCEPTED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
export type CancellationReason = 'CLIENT_REQUEST' | 'COOK_UNAVAILABLE' | 'EMERGENCY' | 'WEATHER' | 'OTHER';
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'BRUNCH';
export type NotificationType = 
  | 'BOOKING_REQUEST'
  | 'BOOKING_ACCEPTED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_REMINDER'
  | 'REVIEW_RECEIVED'
  | 'MESSAGE_RECEIVED'
  | 'PAYMENT_RECEIVED'
  | 'DISPUTE_OPENED'
  | 'PROFILE_APPROVED'
  | 'PROFILE_REJECTED'
  | 'SYSTEM';
export type AddressType = 'HOME' | 'VACATION_RENTAL' | 'WORK' | 'OTHER';
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
  address_id: string | null; // Reference to addresses table
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

// Availabilities table
export interface Availability {
  id: string;
  cook_profile_id: string;
  day_of_week: DayOfWeek;
  meal_type: MealType;
  start_time: string; // TIME format HH:MM:SS
  end_time: string; // TIME format HH:MM:SS
  is_active: boolean;
}

// Blocked dates table
export interface BlockedDate {
  id: string;
  cook_profile_id: string;
  date: string; // DATE format YYYY-MM-DD
  reason: string | null;
}

// DTOs for creating availabilities
export interface CreateAvailabilityDTO {
  day_of_week: DayOfWeek;
  meal_type: MealType;
  start_time: string; // TIME format HH:MM:SS
  end_time: string; // TIME format HH:MM:SS
  is_active?: boolean;
}

// DTOs for creating blocked dates
export interface CreateBlockedDateDTO {
  date: string; // DATE format YYYY-MM-DD
  reason?: string;
}

// Favorite cooks table
export interface FavoriteCook {
  id: string;
  client_profile_id: string;
  cook_profile_id: string;
  created_at: string;
}

// Notifications table
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string | null;
  message: string | null;
  action_url: string | null;
  metadata: Record<string, any> | null; // JSONB
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

// DTOs for creating notifications
export interface CreateNotificationDTO {
  user_id: string;
  type: NotificationType;
  title?: string;
  message?: string;
  action_url?: string;
  metadata?: Record<string, any>;
}

// Addresses table
export interface Address {
  id: string;
  client_profile_id: string;
  type: AddressType;
  label: string | null;
  street: string | null;
  street_number: string | null;
  complement: string | null;
  city: string | null;
  postal_code: string | null;
  country: string;
  location: unknown | null; // PostGIS GEOGRAPHY(POINT,4326)
  access_code: string | null;
  access_notes: string | null;
  parking_info: string | null;
  has_oven: boolean;
  has_dishwasher: boolean;
  kitchen_notes: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// DTOs for creating addresses
export interface CreateAddressDTO {
  type?: AddressType;
  label?: string;
  street: string;
  street_number: string;
  complement?: string;
  city: string;
  postal_code: string;
  country?: string;
  latitude: number; // For PostGIS conversion
  longitude: number; // For PostGIS conversion
  access_code?: string;
  access_notes?: string;
  parking_info?: string;
  has_oven?: boolean;
  has_dishwasher?: boolean;
  kitchen_notes?: string;
  is_default?: boolean;
}

// Cook Portfolio table (matches SQL: cook_portfolio)
export interface CookPortfolioItem {
  id: string;
  cook_profile_id: string;
  title: string;
  description: string | null;
  media_url: string; // Changed from image_url to match SQL
  created_at: string;
  updated_at: string;
}

// DTOs for creating portfolio items
export interface CreatePortfolioItemDTO {
  title: string;
  description?: string;
  media_url: string; // Changed from image_url
}

export interface UpdatePortfolioItemDTO {
  title?: string;
  description?: string;
  media_url?: string;
}

// Cook Certification table (matches SQL: cook_certifications)
export type CertificationType = 
  | 'HYGIENE_HACCP'
  | 'FIRST_AID'
  | 'FOOD_ALLERGY'
  | 'PROFESSIONAL_CHEF'
  | 'NUTRITION'
  | 'PASTRY'
  | 'WINE_PAIRING'
  | 'OTHER';

export interface CookCertification {
  id: string;
  cook_profile_id: string;
  certification: CertificationType; // Changed from name to match SQL ENUM
  issued_by: string; // Changed from issuing_organization
  issue_date: string | null; // DATE
  expiry_date: string | null; // DATE (null if no expiry)
  certificate_url: string | null; // URL to certificate document/image
  created_at: string;
}

// DTOs for creating certifications
export interface CreateCertificationDTO {
  certification: CertificationType;
  issued_by: string;
  issue_date?: string; // DATE format YYYY-MM-DD
  expiry_date?: string; // DATE format YYYY-MM-DD
  certificate_url?: string;
}

export interface UpdateCertificationDTO {
  certification?: CertificationType;
  issued_by?: string;
  issue_date?: string;
  expiry_date?: string;
  certificate_url?: string;
}

// Dispute types (matches SQL)
export type DisputeStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';
export type DisputeReason = 
  | 'SERVICE_NOT_PROVIDED'
  | 'POOR_QUALITY'
  | 'LATE_ARRIVAL'
  | 'HYGIENE_ISSUE'
  | 'DAMAGE'
  | 'PAYMENT_ISSUE'
  | 'OTHER';

// Dispute table (matches SQL: disputes)
export interface Dispute {
  id: string;
  booking_id: string;
  raised_by: string; // Changed from opened_by to match SQL
  status: DisputeStatus; // 'OPEN' not 'OPENED'
  reason: DisputeReason; // Changed from dispute_type to match SQL ENUM
  description: string;
  resolution: string | null; // TEXT, not ENUM
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

// DTOs for creating disputes
export interface CreateDisputeDTO {
  booking_id: string;
  reason: DisputeReason;
  description: string;
}

export interface UpdateDisputeDTO {
  description?: string;
  status?: DisputeStatus;
}

export interface ResolveDisputeDTO {
  resolution: string; // TEXT, not ENUM
  refund_amount?: number; // For reference, but handled via transactions
}

// Transaction types (matches SQL)
export type TransactionType = 
  | 'BOOKING_PAYMENT'
  | 'REFUND'
  | 'PAYOUT'
  | 'PLATFORM_FEE'
  | 'BONUS'
  | 'PENALTY';

export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

// Transaction table (matches SQL: transactions)
export interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  booking_id: string | null;
  from_user_id: string | null;
  to_user_id: string | null;
  amount: number;
  currency: string;
  stripe_payment_id: string | null;
  stripe_transfer_id: string | null;
  stripe_refund_id: string | null;
  description: string | null;
  metadata: Record<string, any> | null; // JSONB
  completed_at: string | null;
  failure_reason: string | null;
  created_at: string;
}

// DTOs for creating transactions
export interface CreateTransactionDTO {
  type: TransactionType;
  booking_id?: string;
  from_user_id?: string;
  to_user_id?: string;
  amount: number;
  currency?: string;
  stripe_payment_id?: string;
  stripe_transfer_id?: string;
  stripe_refund_id?: string;
  description?: string;
  metadata?: Record<string, any>;
}

// Client dietary preferences (M:N tables)
export type CuisineType = 
  | 'FRENCH'
  | 'ITALIAN'
  | 'ASIAN'
  | 'MEDITERRANEAN'
  | 'VEGETARIAN'
  | 'VEGAN'
  | 'HEALTHY'
  | 'TRADITIONAL'
  | 'GASTRONOMIC'
  | 'COMFORT_FOOD'
  | 'INTERNATIONAL'
  | 'FUSION'
  | 'SEAFOOD'
  | 'GRILLED'
  | 'PASTRY';

export interface ClientDietaryRestriction {
  client_profile_id: string;
  restriction: DietaryRestriction;
}

export interface ClientAllergy {
  client_profile_id: string;
  allergy: Allergy;
}

export interface ClientFavoriteCuisine {
  client_profile_id: string;
  cuisine: CuisineType;
}


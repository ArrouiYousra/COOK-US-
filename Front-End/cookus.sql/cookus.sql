-- ============================================
-- 0. EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- 1. ENUMS
-- ============================================

-- Users
CREATE TYPE user_role AS ENUM ('CLIENT','COOK','ADMIN');
CREATE TYPE user_status AS ENUM ('ACTIVE','SUSPENDED','DELETED','PENDING_VERIFICATION');

-- Cook
CREATE TYPE cook_status AS ENUM ('PENDING_APPROVAL','ACTIVE','PAUSED','SUSPENDED','REJECTED');
CREATE TYPE employment_status AS ENUM ('AUTO_ENTREPRENEUR','PORTAGE_SALARIAL','MICRO_ENTREPRISE','ASSOCIATION');

-- Booking
CREATE TYPE booking_status AS ENUM ('PENDING','ACCEPTED','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','DISPUTED');
CREATE TYPE cancellation_reason AS ENUM ('CLIENT_REQUEST','COOK_UNAVAILABLE','EMERGENCY','WEATHER','OTHER');

-- Day/Meal
CREATE TYPE day_of_week AS ENUM ('MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY');
CREATE TYPE meal_type AS ENUM ('BREAKFAST','LUNCH','DINNER','BRUNCH');

-- Review / Rating
CREATE TYPE message_type AS ENUM ('TEXT','IMAGE','SYSTEM');

-- Dispute
CREATE TYPE dispute_status AS ENUM ('OPEN','IN_REVIEW','RESOLVED','CLOSED');
CREATE TYPE dispute_reason AS ENUM ('SERVICE_NOT_PROVIDED','POOR_QUALITY','LATE_ARRIVAL','HYGIENE_ISSUE','DAMAGE','PAYMENT_ISSUE','OTHER');

-- Transaction
CREATE TYPE transaction_type AS ENUM ('BOOKING_PAYMENT','REFUND','PAYOUT','PLATFORM_FEE','BONUS','PENALTY');
CREATE TYPE transaction_status AS ENUM ('PENDING','COMPLETED','FAILED','CANCELLED');

-- Address
CREATE TYPE address_type AS ENUM ('HOME','VACATION_RENTAL','WORK','OTHER');

-- Notification
CREATE TYPE notification_type AS ENUM (
  'BOOKING_REQUEST','BOOKING_ACCEPTED','BOOKING_CONFIRMED','BOOKING_CANCELLED',
  'BOOKING_REMINDER','REVIEW_RECEIVED','MESSAGE_RECEIVED','PAYMENT_RECEIVED',
  'DISPUTE_OPENED','PROFILE_APPROVED','PROFILE_REJECTED','SYSTEM'
);

-- Promo
CREATE TYPE promo_code_type AS ENUM ('PERCENTAGE','FIXED_AMOUNT','FREE_SERVICE');

-- Cuisine / Dietary / Allergy / Specialty
CREATE TYPE cuisine_type AS ENUM (
  'FRENCH','ITALIAN','ASIAN','MEDITERRANEAN','VEGETARIAN','VEGAN','HEALTHY','TRADITIONAL',
  'GASTRONOMIC','COMFORT_FOOD','INTERNATIONAL','FUSION','SEAFOOD','GRILLED','PASTRY'
);
CREATE TYPE dietary_restriction AS ENUM (
  'VEGETARIAN','VEGAN','GLUTEN_FREE','LACTOSE_FREE','HALAL','KOSHER','LOW_CARB','KETO','PALEO','DIABETIC'
);
CREATE TYPE allergy AS ENUM (
  'PEANUTS','TREE_NUTS','MILK','EGGS','FISH','SHELLFISH','SOY','WHEAT','SESAME','MUSTARD','CELERY','LUPIN','SULFITES'
);
CREATE TYPE specialty AS ENUM (
  'FRENCH_CUISINE','ITALIAN_PASTA','SUSHI','BARBECUE','PASTRY','BREAD_MAKING','MOLECULAR_CUISINE','RAW_FOOD',
  'BABY_FOOD','DIET_MEALS','PARTY_CATERING','BREAKFAST','BRUNCH','TAPAS','FINGER_FOOD'
);

-- Certification
CREATE TYPE certification_type AS ENUM ('HYGIENE_HACCP','FIRST_AID','FOOD_ALLERGY','PROFESSIONAL_CHEF','NUTRITION','PASTRY','WINE_PAIRING','OTHER');

-- ============================================
-- 2. USERS
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified TIMESTAMP,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE,
  phone_verified TIMESTAMP,
  
  role user_role DEFAULT 'CLIENT',
  status user_status DEFAULT 'PENDING_VERIFICATION',
  
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  date_of_birth DATE,
  
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(10) DEFAULT 'FR',
  location GEOGRAPHY(POINT,4326),
  
  language VARCHAR(10) DEFAULT 'fr',
  currency VARCHAR(10) DEFAULT 'EUR',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT,
  last_login_at TIMESTAMP,
  last_login_ip INET,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_users_role_status ON users(role, status);

-- ============================================
-- 3. COOK PROFILE
-- ============================================
CREATE TABLE cook_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  status cook_status DEFAULT 'PENDING_APPROVAL',
  
  headline TEXT NOT NULL,
  bio TEXT,
  experience TEXT,
  video_intro_url TEXT,
  
  service_radius INT DEFAULT 10,
  location GEOGRAPHY(POINT,4326),
  
  hourly_rate NUMERIC(10,2) NOT NULL,
  minimum_booking_hours INT DEFAULT 2,
   
  can_do_groceries BOOLEAN DEFAULT FALSE,
  can_set_table BOOLEAN DEFAULT FALSE,
  can_do_dishes BOOLEAN DEFAULT FALSE,
  max_guests INT DEFAULT 6,
  
  employment_status employment_status NOT NULL,
  siret_number VARCHAR(20) UNIQUE,
  siret_verified BOOLEAN DEFAULT FALSE,
  siret_verified_at TIMESTAMP,
  insurance_number VARCHAR(50),
  insurance_expiry_date DATE,
  
  id_card_url TEXT,
  insurance_cert_url TEXT,
  kbis_url TEXT,
  
  is_available BOOLEAN DEFAULT TRUE,
  availability_note TEXT,
  
  total_bookings INT DEFAULT 0,
  total_earnings NUMERIC(12,2) DEFAULT 0,
  average_rating NUMERIC(3,2),
  response_rate NUMERIC(5,2),
  response_time INT,
  
  is_verified BOOLEAN DEFAULT FALSE,
  is_super_cook BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_cook_profiles_status ON cook_profiles(status);
CREATE INDEX idx_cook_profiles_rating ON cook_profiles(average_rating);

-- ============================================
-- 4. CLIENT PROFILE
-- ============================================
CREATE TABLE client_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  household_size INT,
  pet_friendly BOOLEAN DEFAULT FALSE,
  smoking_allowed BOOLEAN DEFAULT FALSE,
  total_bookings INT DEFAULT 0,
  total_spent NUMERIC(12,2) DEFAULT 0,
  average_rating_given NUMERIC(3,2),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- M:N tables pour cuisines/allergies/restrictions
CREATE TABLE client_dietary_restrictions (
  client_profile_id UUID REFERENCES client_profiles(id) ON DELETE CASCADE,
  restriction dietary_restriction,
  PRIMARY KEY (client_profile_id, restriction)
);
CREATE TABLE client_allergies (
  client_profile_id UUID REFERENCES client_profiles(id) ON DELETE CASCADE,
  allergy allergy,
  PRIMARY KEY (client_profile_id, allergy)
);
CREATE TABLE client_favorite_cuisines (
  client_profile_id UUID REFERENCES client_profiles(id) ON DELETE CASCADE,
  cuisine cuisine_type,
  PRIMARY KEY (client_profile_id, cuisine)
);

-- ============================================
-- 5. AVAILABILITY & BLOCKED DATES
-- ============================================
CREATE TABLE availabilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cook_profile_id UUID REFERENCES cook_profiles(id) ON DELETE CASCADE,
  day_of_week day_of_week NOT NULL,
  meal_type meal_type NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(cook_profile_id, day_of_week, meal_type)
);

CREATE TABLE blocked_dates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cook_profile_id UUID REFERENCES cook_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  reason TEXT
);
CREATE UNIQUE INDEX idx_blocked_dates_cook_date ON blocked_dates(cook_profile_id, date);

-- ============================================
-- 6. BOOKINGS
-- ============================================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_profile_id UUID REFERENCES client_profiles(id),
  cook_profile_id UUID REFERENCES cook_profiles(id),
  booking_date DATE NOT NULL,
  meal_type meal_type,
  start_time TIME,
  end_time TIME,
  number_of_guests INT,
  
  status booking_status DEFAULT 'PENDING',
  need_groceries BOOLEAN DEFAULT FALSE,
  need_table_setting BOOLEAN DEFAULT FALSE,
  need_dishes BOOLEAN DEFAULT FALSE,
  
  dietary_restrictions dietary_restriction[],
  allergies allergy[],
  special_requests TEXT,
  ingredients_available TEXT,
  
  hourly_rate NUMERIC(10,2),
  hours_booked NUMERIC(5,2),
  extra_services_price NUMERIC(10,2) DEFAULT 0,
  subtotal NUMERIC(12,2),
  platform_fee NUMERIC(12,2),
  total_price NUMERIC(12,2),
  cook_earnings NUMERIC(12,2),
  
  payment_intent_id VARCHAR(255) UNIQUE,
  payment_status VARCHAR(50),
  paid_at TIMESTAMP,
  
  cancelled_at TIMESTAMP,
  cancelled_by UUID,
  cancellation_reason cancellation_reason,
  cancellation_note TEXT,
  refund_amount NUMERIC(12,2),
  refunded_at TIMESTAMP,
  
  completed_at TIMESTAMP,
  review_deadline TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_bookings_status_date ON bookings(status, booking_date);
CREATE INDEX idx_bookings_client ON bookings(client_profile_id);
CREATE INDEX idx_bookings_cook ON bookings(cook_profile_id);

-- ============================================
-- 7. MESSAGERIE
-- ============================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID UNIQUE REFERENCES bookings(id),
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP,
  unread_count INT DEFAULT 0,
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type message_type DEFAULT 'TEXT',
  content TEXT,
  attachment_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- ============================================
-- 8. TRANSACTIONS
-- ============================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type transaction_type,
  status transaction_status DEFAULT 'PENDING',
  booking_id UUID REFERENCES bookings(id),
  from_user_id UUID REFERENCES users(id),
  to_user_id UUID REFERENCES users(id),
  amount NUMERIC(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'EUR',
  stripe_payment_id VARCHAR(255) UNIQUE,
  stripe_transfer_id VARCHAR(255) UNIQUE,
  stripe_refund_id VARCHAR(255) UNIQUE,
  description TEXT,
  metadata JSONB,
  completed_at TIMESTAMP,
  failure_reason TEXT,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_transactions_status ON transactions(status);

-- ============================================
-- 9. ADRESSES
-- ============================================
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_profile_id UUID REFERENCES client_profiles(id) ON DELETE CASCADE,
  type address_type DEFAULT 'HOME',
  label TEXT,
  street TEXT,
  street_number TEXT,
  complement TEXT,
  city TEXT,
  postal_code TEXT,
  country VARCHAR(10) DEFAULT 'FR',
  location GEOGRAPHY(POINT,4326),
  access_code TEXT,
  access_notes TEXT,
  parking_info TEXT,
  has_oven BOOLEAN DEFAULT TRUE,
  has_dishwasher BOOLEAN DEFAULT FALSE,
  kitchen_notes TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_addresses_client ON addresses(client_profile_id);

-- ============================================
-- 10. FAVORITES
-- ============================================
CREATE TABLE favorite_cooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_profile_id UUID REFERENCES client_profiles(id) ON DELETE CASCADE,
  cook_profile_id UUID REFERENCES cook_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(client_profile_id, cook_profile_id)
);

-- ============================================
-- 11. NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type notification_type,
  title TEXT,
  message TEXT,
  action_url TEXT,
  metadata JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

-- ============================================
-- 12. REVIEWS
-- ============================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reviewee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating NUMERIC(3,2) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);

-- ============================================
-- 13. COOK PORTFOLIO / CERTIFICATIONS
-- ============================================
CREATE TABLE cook_portfolio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cook_profile_id UUID REFERENCES cook_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  media_url TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE cook_certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cook_profile_id UUID REFERENCES cook_profiles(id) ON DELETE CASCADE,
  certification certification_type NOT NULL,
  issued_by TEXT,
  issue_date DATE,
  expiry_date DATE,
  certificate_url TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- ============================================
-- 14. DISPUTES
-- ============================================
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  raised_by UUID REFERENCES users(id),
  status dispute_status DEFAULT 'OPEN',
  reason dispute_reason,
  description TEXT,
  resolution TEXT,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_disputes_status ON disputes(status);

-- ============================================
-- 15. PROMO CODES
-- ============================================
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  type promo_code_type NOT NULL,
  value NUMERIC(10,2) NOT NULL,
  usage_limit INT DEFAULT 1,
  used_count INT DEFAULT 0,
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  min_booking_amount NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- ============================================
-- 16. REFERRALS
-- ============================================
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES users(id),
  referee_id UUID REFERENCES users(id),
  reward_amount NUMERIC(10,2),
  reward_given BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now(),
  rewarded_at TIMESTAMP
);
CREATE UNIQUE INDEX idx_referrals_pair ON referrals(referrer_id, referee_id);

-- ============================================
-- 17. AUDIT LOGS / ACTIVITY TRACKING
-- ============================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name, record_id);

-- ============================================
-- 18. SYSTEM SETTINGS / CONFIG
-- ============================================
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB,
  description TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- ============================================
-- 19. FINAL OPTIMISATIONS
-- ============================================
-- Full Text Search (optionnel pour recherches cuisine, bio, etc.)
CREATE INDEX idx_cook_profiles_bio_fts ON cook_profiles USING GIN(to_tsvector('french', bio));

-- Geospatial Index
CREATE INDEX idx_users_location ON users USING GIST(location);
CREATE INDEX idx_cook_profiles_location ON cook_profiles USING GIST(location);

-- Trigger: updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to tables
DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname='public' 
      AND tablename IN (
        'users','cook_profiles','client_profiles','bookings',
        'addresses','favorite_cooks','notifications','reviews',
        'cook_portfolio','cook_certifications','disputes',
        'promo_codes','referrals','system_settings'
      )
  LOOP
    EXECUTE format('
      CREATE TRIGGER %I_updated_at_trigger
      BEFORE UPDATE ON %I
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
    ', tbl.tablename, tbl.tablename);
  END LOOP;
END$$;

-- Function to update address location with PostGIS POINT
CREATE OR REPLACE FUNCTION update_address_location(
  addr_id UUID,
  lat NUMERIC,
  lng NUMERIC
)
RETURNS VOID AS $$
BEGIN
  UPDATE addresses 
  SET location = ST_SetSRID(ST_MakePoint(lng, lat), 4326) 
  WHERE id = addr_id;
END;
$$ LANGUAGE plpgsql;


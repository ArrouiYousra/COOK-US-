declare namespace NodeJS {
  interface ProcessEnv {
    // Server
    PORT: string;
    NODE_ENV: "development" | "production" | "test";

    // Supabase
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;

    // JWT
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;

    // Stripe
    STRIPE_SECRET_KEY: string;
    STRIPE_PUBLISHABLE_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;

    // Mapbox
    MAPBOX_ACCESS_TOKEN: string;

    // Resend (Email)
    RESEND_API_KEY: string;
    RESEND_FROM_EMAIL?: string;
    RESEND_FROM_NAME?: string;

    // Twilio (SMS)
    TWILIO_ACCOUNT_SID?: string;
    TWILIO_AUTH_TOKEN?: string;
    TWILIO_PHONE_NUMBER?: string;

    // Firebase (Push Notifications)
    FIREBASE_PROJECT_ID?: string;
    FIREBASE_PRIVATE_KEY?: string;
    FIREBASE_CLIENT_EMAIL?: string;

    // Frontend URL (for links in notifications)
    FRONTEND_URL?: string;
  }
}

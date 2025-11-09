declare namespace NodeJS {
  interface ProcessEnv {
    // Server
    PORT: string;
    NODE_ENV: 'development' | 'production' | 'test';

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
  }
}


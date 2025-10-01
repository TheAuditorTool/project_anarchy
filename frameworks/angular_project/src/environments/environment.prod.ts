/**
 * Production environment configuration
 * Phase 13: Framework Misconfigurations
 * ERROR 246: API keys and sensitive data in production environment file
 */

export const environment = {
  production: true,
  
  // ERROR 246: API key committed in production environment
  apiKey: 'prod_api_key_committed_by_mistake',
  
  // More sensitive configuration exposed
  apiUrl: 'https://api.production.com',
  databaseUrl: 'postgresql://admin:password@prod-db.example.com:5432/production',
  
  // Authentication secrets
  jwtSecret: 'super_secret_jwt_key_production',
  refreshTokenSecret: 'refresh_token_secret_prod',
  
  // Third-party service keys
  stripePublishableKey: 'pk_live_51234567890abcdefghijk',
  stripeSecretKey: 'sk_live_51234567890abcdefghijk',
  googleMapsApiKey: 'AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY',
  firebaseConfig: {
    apiKey: 'AIzaSyBnRJKLrPbV6MQHz8pDw0XN9GkRBW-kTDc',
    authDomain: 'production.firebaseapp.com',
    projectId: 'production-project',
    storageBucket: 'production-project.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abcdef123456'
  },
  
  // AWS credentials
  aws: {
    accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
    secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    region: 'us-east-1'
  },
  
  // Monitoring
  sentryDsn: 'https://public@sentry.io/123456',
  
  // Feature flags
  debugMode: true,  // Debug mode in production
  enableLogging: true,
  logLevel: 'verbose',
  
  // Session configuration
  sessionTimeout: 86400000,  // 24 hours - too long
  rememberMeDuration: 2592000000,  // 30 days
  
  // CORS configuration
  allowedOrigins: ['*'],  // Too permissive
  
  // Rate limiting (disabled)
  rateLimitEnabled: false,
  rateLimitRequests: 9999,
  rateLimitWindow: 1
};
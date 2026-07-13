import dotenv from 'dotenv';

dotenv.config();

export const config = {
  app: {
    name: process.env.APP_NAME || 'SwiftPOS',
    port: parseInt(process.env.PORT || '4000', 10),
    env: process.env.NODE_ENV || 'development',
    url: process.env.APP_URL || 'http://localhost:4000',
    apiPrefix: process.env.API_PREFIX || '/api',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@swiftpos.com',
  },
  etims: {
    apiBaseUrl: process.env.ETIMS_API_BASE_URL || 'https://etims-api.kra.go.ke',
    apiKey: process.env.ETIMS_API_KEY || '',
    apiSecret: process.env.ETIMS_API_SECRET || '',
    deviceSerial: process.env.ETIMS_DEVICE_SERIAL || '',
    branchCode: process.env.ETIMS_BRANCH_CODE || '',
    kraPin: process.env.ETIMS_KRA_PIN || '',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
  },
  mpesa: {
    consumerKey: process.env.MPESA_CONSUMER_KEY || '',
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
    passkey: process.env.MPESA_PASSKEY || '',
    shortcode: process.env.MPESA_SHORTCODE || '174379',
    env: process.env.MPESA_ENV || 'sandbox',
    callbackUrl: process.env.MPESA_CALLBACK_URL || 'https://your-domain.com/api/mpesa/callback',
    appName: process.env.APP_NAME || 'SwiftPOS',
  },
  business: {
    currency: process.env.DEFAULT_CURRENCY || 'KES',
    taxRate: parseFloat(process.env.DEFAULT_TAX_RATE || '16'),
    timezone: process.env.DEFAULT_TIMEZONE || 'Africa/Nairobi',
  },
} as const;

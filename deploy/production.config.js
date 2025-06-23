// Configurazione produzione per server proprio
module.exports = {
  // Configurazione dell'app
  app: {
    name: 'highlander-app',
    port: process.env.PORT || 3000,
    host: '0.0.0.0',
    env: 'production'
  },

  // Database
  database: {
    url: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production',
    pool: {
      min: 2,
      max: 10
    }
  },

  // Email
  email: {
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.FROM_EMAIL || 'noreply@yourdomain.com'
  },

  // Sicurezza
  security: {
    sessionSecret: process.env.SESSION_SECRET,
    corsOrigin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com'],
    rateLimiting: {
      windowMs: 15 * 60 * 1000, // 15 minuti
      max: 100 // max richieste per IP
    }
  },

  // Performance
  performance: {
    compression: true,
    staticCaching: '1y',
    apiCaching: '5m'
  }
};
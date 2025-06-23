// Configurazione email centralizzata per Highlander Game
export const EMAIL_CONFIG = {
  domain: 'highlandergame.it',
  fromEmail: 'support@highlandergame.it',
  fromName: 'Highlander Game',
  
  // Configurazione SMTP One.com
  smtp: {
    host: 'send.one.com',
    port: 587,
    secure: false,
    requireTLS: true
  },
  
  // URL base per i link nelle email
  getBaseUrl: () => {
    // Priorità: variabile ambiente esplicita
    if (process.env.BASE_URL) {
      return process.env.BASE_URL;
    }
    
    // Produzione: sempre highlandergame.it
    if (process.env.NODE_ENV === 'production') {
      return 'https://highlandergame.it';
    }
    
    // Sviluppo su Replit
    if (process.env.REPLIT_DEV_DOMAIN) {
      return `https://${process.env.REPLIT_DEV_DOMAIN}`;
    }
    
    // Fallback per sviluppo locale
    return 'http://localhost:5000';
  }
};
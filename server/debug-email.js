// Script debug rapido per verificare configurazione email
const { EMAIL_CONFIG } = require('./email-config.ts');

console.log('Configurazione Email Attuale:');
console.log('From Email:', EMAIL_CONFIG.fromEmail);
console.log('From Name:', EMAIL_CONFIG.fromName);
console.log('Base URL:', EMAIL_CONFIG.getBaseUrl());
console.log('SMTP Host:', EMAIL_CONFIG.smtp.host);
console.log('SMTP Port:', EMAIL_CONFIG.smtp.port);

// Verifica variabili ambiente
console.log('\nVariabili Ambiente:');
console.log('SMTP_USER:', process.env.SMTP_USER ? 'SET' : 'NOT SET');
console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? 'SET' : 'NOT SET');
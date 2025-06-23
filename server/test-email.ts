import { emailService } from './unified-email-service';

// Test funzionalità email per verificare la configurazione
export async function testEmailConfiguration() {
  console.log('\n🧪 Test Configurazione Email...');
  
  // Test connessione
  const connectionTest = await emailService.testConnection();
  
  if (connectionTest) {
    console.log('✅ Sistema email configurato correttamente');
    
    // Test completato - connessione SMTP verificata
    console.log('✅ Connessione SMTP One.com verificata - pronto per invio email reali');
    
  } else {
    console.log('⚠️ Sistema email non configurato - funziona in modalità sviluppo');
  }
  
  console.log('🧪 Test completato\n');
}

// Esegui test se questo file viene chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testEmailConfiguration().catch(console.error);
}
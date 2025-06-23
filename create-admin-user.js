import { Client } from 'pg';
import bcrypt from 'bcryptjs';
import { randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdminUser() {
  const client = new Client({
    connectionString: 'postgresql://highlander_db:HighlanderDB2024!@localhost:5432/highlander_prod'
  });

  try {
    await client.connect();
    console.log('🔗 Connesso al database PostgreSQL');

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      ['admin', 'dicostanzo.fabio@yahoo.it']
    );

    if (existingUser.rows.length > 0) {
      console.log('⚠️ Utente admin già esistente');
      await client.end();
      return;
    }

    // Hash password using same method as auth.ts
    const hashedPassword = await hashPassword('Calibro9!');
    
    // Create admin user
    const result = await client.query(
      `INSERT INTO users (username, email, password, "isAdmin", "emailVerified", "createdAt") 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [
        'admin',
        'dicostanzo.fabio@yahoo.it', 
        hashedPassword,
        true,
        true,
        new Date()
      ]
    );

    console.log('✅ Utente admin creato con successo!');
    console.log('📋 Dettagli:');
    console.log('   Username: admin');
    console.log('   Email: dicostanzo.fabio@yahoo.it');
    console.log('   Password: Calibro9!');
    console.log('   Admin: true');
    console.log('   ID:', result.rows[0].id);

  } catch (error) {
    console.error('❌ Errore creazione utente admin:', error);
  } finally {
    await client.end();
  }
}

createAdminUser();
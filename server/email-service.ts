import { randomBytes } from 'crypto';
import sgMail from '@sendgrid/mail';

interface EmailVerificationData {
  userId: number;
  email: string;
  username: string;
  token: string;
}

interface PasswordResetData {
  email: string;
  username: string;
  token: string;
}

export class EmailService {
  private baseUrl: string;
  private isConfigured: boolean;

  constructor() {
    this.baseUrl = process.env.BASE_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://highlandergame.it' 
        : 'http://localhost:5000');
    
    const apiKey = process.env.SENDGRID_API_KEY;
    this.isConfigured = !!apiKey;
    if (this.isConfigured && apiKey) {
      sgMail.setApiKey(apiKey);
    }
  }

  generateVerificationToken(): string {
    return randomBytes(32).toString('hex');
  }

  async sendVerificationEmail(data: EmailVerificationData): Promise<boolean> {
    const verificationUrl = `${this.baseUrl}/verify-email?token=${data.token}`;
    
    if (this.isConfigured) {
      try {
        const msg = {
          to: data.email,
          from: process.env.FROM_EMAIL || 'dicostanzo.fabio@yahoo.it',
          subject: 'Conferma il tuo account Highlander',
          html: this.getEmailTemplate(data.username, verificationUrl),
        };

        await sgMail.send(msg);
        console.log(`Verification email sent to ${data.email}`);
        return true;
      } catch (error) {
        console.error('SendGrid email error:', error);
        return false;
      }
    } else {
      // Development mode - log email content
      console.log('\n=== EMAIL VERIFICATION (DEVELOPMENT MODE) ===');
      console.log(`To: ${data.email}`);
      console.log(`Subject: Conferma il tuo account Highlander`);
      console.log(`Verification URL: ${verificationUrl}`);
      console.log('===============================================\n');
      return true;
    }
  }

  async sendPasswordResetEmail(data: PasswordResetData): Promise<boolean> {
    const resetUrl = `${this.baseUrl}/reset-password?token=${data.token}`;
    
    if (this.isConfigured) {
      try {
        const msg = {
          to: data.email,
          from: process.env.FROM_EMAIL || 'dicostanzo.fabio@yahoo.it',
          subject: 'Reset della Password - Highlander',
          html: this.getPasswordResetTemplate(data.username, resetUrl),
        };

        await sgMail.send(msg);
        console.log(`Password reset email sent to ${data.email}`);
        return true;
      } catch (error) {
        console.error('SendGrid password reset email error:', error);
        return false;
      }
    } else {
      // Development mode - log email content
      console.log('\n=== PASSWORD RESET EMAIL (DEVELOPMENT MODE) ===');
      console.log(`To: ${data.email}`);
      console.log(`Subject: Reset della Password - Highlander`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log('===============================================\n');
      return true;
    }
  }

  private getEmailTemplate(username: string, verificationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Conferma Account - Highlander</title>
        <style>
          ${this.getEmailStyles()}
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; color: white;">🛡️ Highlander</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Il Gioco di Eliminazione Serie A</p>
          </div>
          
          <div class="content">
            <h2 style="color: #1f2937; margin-top: 0;">Ciao ${username}!</h2>
            
            <p>Benvenuto in <strong>Highlander</strong>, il gioco di eliminazione più avvincente basato sui risultati della Serie A 2025/26!</p>
            
            <p>Per completare la registrazione e iniziare a giocare, conferma il tuo indirizzo email cliccando sul pulsante qui sotto:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="display: inline-block; background: #059669; color: white !important; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);">Conferma Email</a>
            </div>
            
            <p><strong>Cosa ti aspetta:</strong></p>
            <ul>
              <li>🎯 Giochi di eliminazione basati sui risultati reali della Serie A</li>
              <li>📊 Analytics avanzate delle tue performance</li>
              <li>🏆 Sistema di achievement e classifiche</li>
              <li>👥 Funzionalità social e chat con altri giocatori</li>
              <li>📱 App PWA installabile su mobile e desktop</li>
            </ul>
            
            <p>Se non hai richiesto questa registrazione, puoi ignorare questa email.</p>
            
            <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <small><strong>Nota di sicurezza:</strong> Questo link scadrà tra 24 ore per motivi di sicurezza.</small>
            </div>
          </div>
          
          <div class="footer">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              © 2025 Highlander - Gioco di Eliminazione Serie A<br>
              <span class="highlight">Stagione 2025/26</span>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPasswordResetTemplate(username: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Password - Highlander</title>
        <style>
          ${this.getEmailStyles()}
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; color: white;">🛡️ Highlander</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Reset della Password</p>
          </div>
          
          <div class="content">
            <h2 style="color: #1f2937; margin-top: 0;">Ciao ${username}!</h2>
            
            <p>Hai richiesto il reset della password per il tuo account Highlander.</p>
            
            <p>Per impostare una nuova password, clicca sul pulsante qui sotto:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: #dc2626; color: white !important; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);">Reset Password</a>
            </div>
            
            <p><strong>Importante:</strong></p>
            <ul>
              <li>🔒 Questo link è valido solo per 1 ora</li>
              <li>🔑 Potrai scegliere una nuova password sicura</li>
              <li>✅ L'accesso al tuo account rimarrà protetto</li>
            </ul>
            
            <p>Se non hai richiesto questo reset, puoi ignorare questa email. La tua password attuale rimarrà invariata.</p>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <small><strong>Sicurezza:</strong> Per motivi di sicurezza, questo link scadrà automaticamente tra 60 minuti.</small>
            </div>
          </div>
          
          <div class="footer">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              © 2025 Highlander - Gioco di Eliminazione Serie A<br>
              <span class="highlight">Sistema di Sicurezza</span>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getEmailStyles(): string {
    return `
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #374151;
        max-width: 600px;
        margin: 0 auto;
        background-color: #f9fafb;
      }
      .container {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        margin: 20px;
      }
      .header {
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        color: white;
        padding: 30px;
        text-align: center;
      }
      .content {
        padding: 30px;
      }
      .footer {
        background: #f9fafb;
        padding: 20px;
        text-align: center;
        border-top: 1px solid #e5e7eb;
      }
      .button {
        display: inline-block;
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        color: white;
        padding: 12px 30px;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 600;
        transition: transform 0.2s;
      }
      .button:hover {
        transform: translateY(-2px);
      }
      .highlight {
        color: #059669;
        font-weight: 600;
      }
      ul {
        padding-left: 20px;
      }
      li {
        margin: 8px 0;
      }
    `;
  }
}

export const emailService = new EmailService();
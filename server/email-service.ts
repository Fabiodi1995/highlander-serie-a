import { randomBytes } from 'crypto';

interface EmailVerificationData {
  userId: number;
  email: string;
  username: string;
  token: string;
}

// Mock email service - replace with SendGrid when API key is available
export class EmailService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://highlander.replit.app' 
      : 'http://localhost:5000';
  }

  generateVerificationToken(): string {
    return randomBytes(32).toString('hex');
  }

  async sendVerificationEmail(data: EmailVerificationData): Promise<boolean> {
    const verificationUrl = `${this.baseUrl}/api/verify-email/${data.token}`;
    
    // If SendGrid API key is available, send real email
    if (process.env.SENDGRID_API_KEY) {
      try {
        const sgMail = await import('@sendgrid/mail');
        sgMail.default.setApiKey(process.env.SENDGRID_API_KEY);

        const msg = {
          to: data.email,
          from: 'noreply@highlander-app.com',
          subject: 'Conferma il tuo account Highlander',
          html: this.getEmailTemplate(data.username, verificationUrl),
        };

        await sgMail.default.send(msg);
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
      console.log('=== END EMAIL ===\n');
      return true;
    }
  }

  private getEmailTemplate(username: string, verificationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Conferma Email - Highlander</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .button:hover { background: #059669; }
          .highlight { background: #fef3c7; padding: 2px 6px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🏆 Highlander</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Il Gioco di Eliminazione Serie A</p>
          </div>
          
          <div class="content">
            <h2 style="color: #1f2937; margin-top: 0;">Ciao ${username}!</h2>
            
            <p>Benvenuto in <strong>Highlander</strong>, il gioco di eliminazione più avvincente basato sui risultati della Serie A 2025/26!</p>
            
            <p>Per completare la registrazione e iniziare a giocare, conferma il tuo indirizzo email cliccando sul pulsante qui sotto:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" class="button">Conferma Email</a>
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

  async sendPasswordResetEmail(email: string, username: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${this.baseUrl}/reset-password/${resetToken}`;
    
    if (process.env.SENDGRID_API_KEY) {
      try {
        const sgMail = await import('@sendgrid/mail');
        sgMail.default.setApiKey(process.env.SENDGRID_API_KEY);

        const msg = {
          to: email,
          from: 'noreply@highlander-app.com',
          subject: 'Reset Password - Highlander',
          html: this.getPasswordResetTemplate(username, resetUrl),
        };

        await sgMail.default.send(msg);
        return true;
      } catch (error) {
        console.error('SendGrid password reset email error:', error);
        return false;
      }
    } else {
      console.log('\n=== PASSWORD RESET EMAIL (DEVELOPMENT MODE) ===');
      console.log(`To: ${email}`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log('=== END EMAIL ===\n');
      return true;
    }
  }

  private getPasswordResetTemplate(username: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Password - Highlander</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Reset Password</h1>
          <p>Ciao ${username},</p>
          <p>Hai richiesto il reset della password per il tuo account Highlander.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          <p>Se non hai richiesto questo reset, ignora questa email.</p>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();
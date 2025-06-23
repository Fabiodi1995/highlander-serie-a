import { randomBytes } from 'crypto';
import nodemailer from 'nodemailer';
import { EMAIL_CONFIG } from './email-config';

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

interface UsernameRecoveryData {
  email: string;
  username: string;
}

export class UnifiedEmailService {
  private baseUrl: string;
  private emailProvider: 'smtp' | 'none';
  private transporter?: nodemailer.Transporter;

  constructor() {
    this.baseUrl = EMAIL_CONFIG.getBaseUrl();

    // Configura SMTP se le credenziali sono disponibili
    if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      this.emailProvider = 'smtp';
      this.setupSMTP();
    } else {
      this.emailProvider = 'none';
    }

    console.log(`Email provider configured: ${this.emailProvider}`);
  }

  private setupSMTP() {
    const smtpConfig = {
      host: EMAIL_CONFIG.smtp.host,
      port: EMAIL_CONFIG.smtp.port,
      secure: EMAIL_CONFIG.smtp.secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    };

    this.transporter = nodemailer.createTransport(smtpConfig);
  }



  generateVerificationToken(): string {
    return randomBytes(32).toString('hex');
  }

  async sendVerificationEmail(data: EmailVerificationData): Promise<boolean> {
    const verificationUrl = `${this.baseUrl}/verify-email?token=${data.token}`;
    
    switch (this.emailProvider) {
      case 'smtp':
        return this.sendViaSMTP({
          to: data.email,
          subject: 'Conferma il tuo account Highlander',
          html: this.getEmailTemplate(data.username, verificationUrl)
        });

      default:
        this.logEmailToConsole('VERIFICA EMAIL', data.email, verificationUrl);
        return true;
    }
  }

  async sendPasswordResetEmail(data: PasswordResetData): Promise<boolean> {
    const resetUrl = `${this.baseUrl}/reset-password?token=${data.token}`;
    
    switch (this.emailProvider) {
      case 'smtp':
        return this.sendViaSMTP({
          to: data.email,
          subject: 'Reset della Password - Highlander',
          html: this.getPasswordResetTemplate(data.username, resetUrl)
        });

      default:
        this.logEmailToConsole('RESET PASSWORD', data.email, resetUrl);
        return true;
    }
  }

  async sendUsernameRecoveryEmail(data: UsernameRecoveryData): Promise<boolean> {
    switch (this.emailProvider) {
      case 'smtp':
        return this.sendViaSMTP({
          to: data.email,
          subject: 'Recupero Username - Highlander',
          html: this.getUsernameRecoveryTemplate(data.username)
        });

      default:
        console.log('\n===============================================');
        console.log(`📧 RECUPERO USERNAME (Modalità Sviluppo)`);
        console.log('===============================================');
        console.log(`To: ${data.email}`);
        console.log(`Username: ${data.username}`);
        console.log('===============================================\n');
        return true;
    }
  }

  private async sendViaSMTP(emailData: { to: string; subject: string; html: string }): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"${EMAIL_CONFIG.fromName}" <${EMAIL_CONFIG.fromEmail}>`,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
      };

      await this.transporter!.sendMail(mailOptions);
      console.log(`SMTP email sent to ${emailData.to} from ${EMAIL_CONFIG.fromEmail}`);
      return true;
    } catch (error) {
      console.error('SMTP email error:', error);
      return false;
    }
  }



  private logEmailToConsole(type: string, to: string, url: string) {
    console.log('\n===============================================');
    console.log(`📧 ${type} (Modalità Sviluppo)`);
    console.log('===============================================');
    console.log(`To: ${to}`);
    console.log(`URL: ${url}`);
    console.log('===============================================\n');
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
              © 2025 Highlander Game - Serie A 2025/26<br>
              <span class="highlight">highlandergame.it</span>
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
              © 2025 Highlander Game - Serie A 2025/26<br>
              <span class="highlight">highlandergame.it</span>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getUsernameRecoveryTemplate(username: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Recupero Username - Highlander</title>
        <style>
          ${this.getEmailStyles()}
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; color: white;">🛡️ Highlander</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Recupero Username</p>
          </div>
          
          <div class="content">
            <h2 style="color: #1f2937; margin-top: 0;">Ecco il tuo username!</h2>
            
            <p>Hai richiesto il recupero del tuo username per l'account Highlander associato a questa email.</p>
            
            <div style="background: #f0f9ff; border: 2px solid #0284c7; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
              <p style="margin: 0; color: #0369a1; font-size: 14px; font-weight: 500;">Il tuo username è:</p>
              <h3 style="margin: 10px 0 0 0; color: #0c4a6e; font-size: 24px; font-weight: bold;">${username}</h3>
            </div>
            
            <p>Ora puoi utilizzare questo username per accedere al tuo account Highlander.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.baseUrl}/auth" style="display: inline-block; background: #0284c7; color: white !important; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);">Accedi ora</a>
            </div>
            
            <p><strong>Suggerimenti per la sicurezza:</strong></p>
            <ul>
              <li>🔒 Salva il tuo username in un luogo sicuro</li>
              <li>🔑 Se hai dimenticato anche la password, usa il link "Password dimenticata?"</li>
              <li>✅ Considera l'uso di un gestore di password</li>
            </ul>
            
            <p>Se non hai richiesto questo recupero username, puoi ignorare questa email.</p>
            
            <div style="background: #f0fdf4; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #22c55e;">
              <small><strong>Buon gioco!</strong> Ora puoi tornare a sfidare gli altri giocatori in Highlander.</small>
            </div>
          </div>
          
          <div class="footer">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              © 2025 Highlander Game - Serie A 2025/26<br>
              <span class="highlight">highlandergame.it</span>
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

  async testConnection(): Promise<boolean> {
    switch (this.emailProvider) {
      case 'smtp':
        try {
          await this.transporter!.verify();
          console.log('✅ Connessione SMTP verificata');
          return true;
        } catch (error) {
          console.error('❌ Errore SMTP:', error);
          return false;
        }

      default:
        console.log('⚠️ Nessun provider email configurato - modalità sviluppo');
        return true;
    }
  }

  getProvider(): string {
    return this.emailProvider;
  }
}

export const emailService = new UnifiedEmailService();
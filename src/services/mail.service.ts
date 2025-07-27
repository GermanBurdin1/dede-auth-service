import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendVerificationEmail(to: string, token: string) {
    const verificationUrl = `http://localhost:4200/verify-email?token=${token}`;
    const mailOptions = {
      from: process.env.SMTP_USER,
      to,
      subject: 'Confirmez votre adresse e-mail sur GalaxyLang',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f5f6fa; padding: 32px; border-radius: 12px; max-width: 480px; margin: 0 auto; box-shadow: 0 2px 16px rgba(109,40,217,0.08);">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="https://i.imgur.com/8Km9tLL.png" alt="GalaxyLang" style="width: 80px; margin-bottom: 16px;" />
            <h2 style="color: #6d28d9; margin-bottom: 8px;">Bienvenue sur <span style='color: #fbbf24;'>GalaxyLang</span> !</h2>
            <p style="color: #3b82f6; font-size: 18px; margin: 0;">Merci de vous être inscrit(e) sur notre plateforme.</p>
          </div>
          <p style="font-size: 16px; color: #1f2937;">
            Nous sommes ravis de vous accueillir dans notre communauté d'apprenants passionnés !<br>
            Chez <b>GalaxyLang</b>, nous croyons que chaque langue ouvre un nouvel univers de possibilités.<br><br>
            Pour finaliser votre inscription et commencer votre aventure, veuillez confirmer votre adresse e-mail en cliquant sur le bouton ci-dessous :
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(90deg,#6d28d9,#fbbf24); color: #fff; font-weight: 700; padding: 16px 36px; border-radius: 8px; text-decoration: none; font-size: 20px; box-shadow: 0 2px 8px #aeccfd;">Confirmer mon e-mail</a>
          </div>
          <p style="font-size: 15px; color: #6b7280;">Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
          <p style="font-size: 14px; color: #6b7280; word-break: break-all;">${verificationUrl}</p>
          <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 13px; color: #9ca3af; text-align: center;">
            L'équipe <b>GalaxyLang</b> vous souhaite de belles découvertes linguistiques !<br>
            Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement ce message.<br><br>
            <img src="https://i.imgur.com/8Km9tLL.png" alt="GalaxyLang" style="width: 40px; margin-top: 8px;" />
          </p>
        </div>
      `,
    };
    console.log('[MailService] Tentative d\'envoi d\'email:');
    console.log('  SMTP_USER:', process.env.SMTP_USER);
    console.log('  To:', to);
    console.log('  URL de vérification:', verificationUrl);
    try {
      await this.transporter.sendMail(mailOptions);
      console.log('[MailService] Email envoyé avec succès!');
    } catch (err) {
      console.error('[MailService] Erreur lors de l\'envoi d\'email:', err);
      // TODO : implémenter une file d'attente pour les emails échoués
    }
  }
}
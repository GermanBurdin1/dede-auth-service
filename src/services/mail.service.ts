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
      subject: 'Confirmez votre email',
      html: `<p>Merci pour votre inscription. Cliquez ici pour confirmer votre email :</p>
             <a href="${verificationUrl}">${verificationUrl}</a>`,
    };
    console.log('[MailService] Попытка отправить письмо:');
    console.log('  SMTP_USER:', process.env.SMTP_USER);
    console.log('  To:', to);
    console.log('  Verification URL:', verificationUrl);
    try {
      await this.transporter.sendMail(mailOptions);
      console.log('[MailService] Письмо успешно отправлено!');
    } catch (err) {
      console.error('[MailService] Ошибка отправки письма:', err);
    }
  }
}
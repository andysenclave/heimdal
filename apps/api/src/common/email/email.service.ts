import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter!: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const smtpHost = this.config.get<string>('SMTP_HOST');

    if (smtpHost) {
      // Production: use configured SMTP (SendGrid, SES, Resend, etc.)
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: this.config.get<number>('SMTP_PORT') ?? 587,
        secure: false,
        auth: {
          user: this.config.getOrThrow<string>('SMTP_USER'),
          pass: this.config.getOrThrow<string>('SMTP_PASS'),
        },
      });
      this.logger.log(`Email: SMTP configured at ${smtpHost}`);
    } else {
      // Dev: Ethereal fake SMTP — no external service needed.
      // Every email is captured; preview URL is logged to console.
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      this.logger.log(`Email: Ethereal dev account → ${testAccount.user}`);
      this.logger.log(`Email: View sent mail at https://ethereal.email`);
    }
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const appUrl = this.config.get<string>('APP_URL') ?? 'http://localhost:5173';
    const verifyUrl = `${appUrl}/auth/verify-email?token=${token}`;
    const from = this.config.get<string>('SMTP_FROM') ?? '"Heimdal IAM" <no-reply@heimdal.dev>';

    const info = await this.transporter.sendMail({
      from,
      to,
      subject: 'Verify your Heimdal email address',
      text: [
        'Welcome to Heimdal!',
        '',
        'Please verify your email address by visiting the link below.',
        'This link expires in 24 hours.',
        '',
        verifyUrl,
        '',
        "If you didn't sign up for Heimdal, you can safely ignore this email.",
      ].join('\n'),
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="margin-bottom: 8px;">Welcome to Heimdal</h2>
          <p style="color: #555; margin-bottom: 24px;">
            Please verify your email address to activate your account.
            This link expires in <strong>24 hours</strong>.
          </p>
          <a href="${verifyUrl}"
             style="display: inline-block; padding: 12px 24px; background: #18181b;
                    color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Verify Email
          </a>
          <p style="color: #999; font-size: 12px; margin-top: 32px;">
            If the button doesn't work, copy this link into your browser:<br/>
            <a href="${verifyUrl}" style="color: #555;">${verifyUrl}</a>
          </p>
          <p style="color: #bbb; font-size: 11px; margin-top: 16px;">
            Didn't sign up? You can safely ignore this email.
          </p>
        </div>
      `,
    });

    // Ethereal gives a preview URL — log it so dev can view the email instantly
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      this.logger.log(`📧 Email preview (open in browser): ${previewUrl}`);
    }
  }
}

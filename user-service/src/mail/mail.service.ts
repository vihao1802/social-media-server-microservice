import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { SentMessageInfo } from 'nodemailer';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendVerifyEmailMail(
    to: string,
    subject: string,
    url: string,
    username?: string,
  ): Promise<SentMessageInfo> {
    return await this.mailerService.sendMail({
      to: to,
      from: process.env.EMAIL_USER, // override default from
      subject: subject,
      template: './confirmation', // `.hbs` extension is appended automatically
      context: {
        name: username || to,
        url,
      },
    });
  }
  async sendOTP(
    to: string,
    subject: string,
    otp_code: string,
    username?: string,
  ): Promise<SentMessageInfo> {
    return await this.mailerService.sendMail({
      to: to,
      from: process.env.EMAIL_USER, // override default from
      subject: subject,
      template: './forgot-password', // `.hbs` extension is appended automatically
      context: {
        name: username || to,
        otp_code,
      },
    });
  }
}

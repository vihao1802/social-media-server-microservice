import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendMail(to: string, subject: string, url: string, username?: string) {
    console.log('sending email', process.env.EMAIL_PASS);

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
}

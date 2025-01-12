import {
  HttpCode,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateUserDTO } from './dto/request/create-user.dto';
import { DatabaseService } from 'src/database/database.service';
import { SignInRequest } from './dto/request/sign-in.dto';
import { UserService } from 'src/user/user.service';
import { BadRequestException } from 'src/exception-handler/bad-request.exception';
import { ErrorCodes } from 'src/exception-handler/error-code.constant';
import { InternalServerException } from 'src/exception-handler/internal-server.exception';
import { Prisma, User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { AuthJwtPayload } from './types/jwt-payload';
import refreshJwtConfig from './config/refresh-jwt.config';
import { ConfigType } from '@nestjs/config';
import { create } from 'domain';
import * as bcrypt from 'bcrypt';
import { MailService } from 'src/mail/mail.service';
import { generateRandomNumber } from 'src/utils/generator.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    @Inject(refreshJwtConfig.KEY)
    private readonly refreshTokenConfig: ConfigType<typeof refreshJwtConfig>,
  ) {}

  async verifyUser(signInRequest: SignInRequest) {
    const user = await this.userService.findByEmail(signInRequest.email);

    if (!user)
      throw new BadRequestException(
        ErrorCodes.BadRequestCode.INVALID_EMAIL_PASSWORD,
      );

    const checkPassword = await this.comparePassword(
      signInRequest.password,
      user.hashedPassword,
    );

    if (!checkPassword)
      throw new BadRequestException(
        ErrorCodes.BadRequestCode.INVALID_EMAIL_PASSWORD,
      );

    return user;
  }

  async signIn(user: User) {
    return this.createToken(user, true);
  }

  async refreshToken(user: User, role: string) {
    {
      const access_token = await this.createToken(user, false);
      return {
        email: user.email,
        ...access_token,
      };
    }
  }

  async sendConfirmEmail(email: string) {
    const usr = await this.userService.findByEmail(email);

    if (!usr)
      throw new BadRequestException(ErrorCodes.BadRequestCode.USER_NOT_FOUND);

    if (usr.isEmailVerified)
      throw new BadRequestException(
        ErrorCodes.BadRequestCode.EMAIL_ALREADY_VERIFIED,
      );

    const { access_token } = await this.createToken(usr, false);

    const subject = 'Confirm email';

    const url = `${process.env.SERVER_DOMAIN}/auth/confirm-email?token=${access_token}`;

    return await this.mailService.sendVerifyEmailMail(
      email,
      subject,
      url,
      usr.username,
    );
  }

  async confirmEmail(token: string) {
    if (!token)
      throw new BadRequestException(ErrorCodes.BadRequestCode.INVALID_REQUEST);

    const payload: AuthJwtPayload = await this.jwtService.verifyAsync(token);

    const user = await this.userService.findByEmail(payload.email);

    if (!user)
      throw new BadRequestException(ErrorCodes.BadRequestCode.USER_NOT_FOUND);

    await this.userService.verifyEmail(payload.sub);
  }

  async forgotPassword(email: string) {
    const usr = await this.userService.findByEmail(email);

    if (!usr)
      throw new BadRequestException(ErrorCodes.BadRequestCode.USER_NOT_FOUND);

    if (!usr.isEmailVerified)
      throw new BadRequestException(
        ErrorCodes.BadRequestCode.EMAIL_NOT_VERIFIED,
      );

    try {
      const opt_code = generateRandomNumber().toString();

      await this.mailService.sendOTP(
        email,
        'Forgot password',
        opt_code,
        usr.username,
      );

      const opt_code_encrypted = await this.userService.hashedData(opt_code);

      await this.databaseService.userOTP.create({
        data: {
          otp: opt_code_encrypted,
          userId: usr.id,
        },
      });
    } catch (error: any) {
      console.error(error);
      throw new InternalServerErrorException(
        ErrorCodes.InternalServerErrorCode.EMAIL_SEND_FAILED,
      );
    }
  }

  async verifyOTP(email: string, otp: string) {
    const otpData = await this.databaseService.userOTP.findFirst({
      where: {
        user: {
          email,
        },
      },
      include: {
        user: true,
      },
    });

    if (!otpData)
      throw new BadRequestException(ErrorCodes.BadRequestCode.INVALID_OTP);

    if (
      otpData.createdAt.getTime() + parseInt(process.env.OTP_EXPIRES_IN) <
      Date.now()
    )
      throw new BadRequestException(ErrorCodes.BadRequestCode.OTP_EXPIRED);

    const isValid = await bcrypt.compare(otp, otpData.otp);

    if (!isValid)
      throw new BadRequestException(ErrorCodes.BadRequestCode.INVALID_OTP);

    const resetToken = await this.createToken(otpData.user, false);

    await this.databaseService.userOTP.delete({
      where: {
        id: otpData.id,
      },
    });

    return {
      ...resetToken,
    };
  }

  async resetPassword(
    resetToken: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    if (newPassword !== confirmPassword)
      throw new BadRequestException(ErrorCodes.BadRequestCode.INVALID_REQUEST);

    const payload: AuthJwtPayload =
      await this.jwtService.verifyAsync(resetToken);

    if (!payload)
      throw new BadRequestException(ErrorCodes.BadRequestCode.INVALID_TOKEN);

    try {
      return await this.userService.resetPassword(payload.sub, newPassword);
    } catch (error) {
      throw new InternalServerErrorException(
        ErrorCodes.InternalServerErrorCode.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async createToken(user: User, createRefreshToken = false) {
    const { role } = await this.userService.findUserRole(user.id);
    const payload: AuthJwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: role.roleName,
      iat: Date.now(),
    };
    const access_token = await this.jwtService.signAsync(payload);
    const refresh_token = await this.jwtService.signAsync(
      payload,
      this.refreshTokenConfig,
    );
    return createRefreshToken
      ? { access_token, refresh_token }
      : { access_token };
  }

  private async comparePassword(
    rawPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(rawPassword, hashedPassword);
  }
}

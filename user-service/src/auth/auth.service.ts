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
import { Formater } from 'src/utils/format.util';
import refreshJwtConfig from './config/refresh-jwt.config';
import { ConfigType } from '@nestjs/config';
import { create } from 'domain';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
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

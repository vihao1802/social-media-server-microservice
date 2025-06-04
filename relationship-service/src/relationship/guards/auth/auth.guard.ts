import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { firstValueFrom, Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger: Logger;
  constructor(private readonly httpService: HttpService) {
    this.logger = new Logger(AuthGuard.name);
  }
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const BearerToken = request.headers['authorization'];

    if (!BearerToken) {
      this.logger.error(
        `400: { request_url: ${request.url}, message: 'authorized' }`,
      );
      throw new UnauthorizedException('Unauthorized');
    }
    try {
      const url = `${process.env.USER_SERVICE_URL}/auth/me`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            Authorization: BearerToken,
          },
        }),
      );
      request.user = {
        ...response.data.data, // Lấy toàn bộ thông tin user từ API
        Token: BearerToken, // Thêm token vào object user
      };

      return true;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new UnauthorizedException('Unauthorized');
    }
  }
}

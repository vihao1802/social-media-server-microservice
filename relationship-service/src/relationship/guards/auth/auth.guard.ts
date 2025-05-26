import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { firstValueFrom, Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly httpService: HttpService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const BearerToken = request.headers['authorization'];

    if (!BearerToken) {
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

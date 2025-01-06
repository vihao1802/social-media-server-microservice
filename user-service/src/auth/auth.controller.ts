import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Request,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { zodValidationPipe } from './pipes/zodValidationPipe';
import { CreateUserDTO, CreateUserSchema } from './dto/request/create-user.dto';
import { SignInRequest, SignInRequestSchema } from './dto/request/sign-in.dto';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';
import { RefreshJwtAuthGuard } from './guards/refresh-jwt-auth/refresh-jwt-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly _authService: AuthService,
    private readonly _userService: UserService,
  ) {}

  // @UsePipes(new zodValidationPipe(SignInRequestSchema))
  @UseGuards(LocalAuthGuard)
  @Post('sign-in')
  async SignIn(@Request() req) {
    const token = await this._authService.signIn(
      req.user,
      req.user.role.roleName,
    );
    return {
      email: req.user.email,
      ...token,
    };
  }

  @Post('sign-up')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new zodValidationPipe(CreateUserSchema))
  async SignUp(@Body() body: CreateUserDTO) {
    return await this._userService.createUser(body);
  }

  @UseGuards(RefreshJwtAuthGuard)
  @Post('/refresh-token')
  async RefreshToken(@Request() req) {
    return await this._authService.refreshToken(req.user, req.user.role);
  }

  @Post('/introspect')
  @UseGuards(JwtAuthGuard)
  async Introspect(@Request() req) {
    return {
      email: req.user.email,
      isValid: true,
    };
  }
}

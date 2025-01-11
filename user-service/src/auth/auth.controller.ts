import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Request,
  Res,
  Response,
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
import { GoogleAuthGuard } from './guards/google-auth/google-auth.guard';
import { FacebookAuthGuard } from './guards/facebook-auth/facebook-auth.guard';

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
    const token = await this._authService.signIn(req.user);
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

  @Get('google/login')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Request() req, @Res() res) {
    const token = await this._authService.signIn(req.user);

    res.redirect(
      `http://localhost:3000?access_token=${token.access_token}&refresh_token=${token.refresh_token}`,
    );
  }
  @Get('facebook/login')
  @UseGuards(FacebookAuthGuard)
  facebookLogin() {}

  @Get('facebook/callback')
  @UseGuards(FacebookAuthGuard)
  async facebookCallback(@Request() req, @Response() res) {
    const token = await this._authService.signIn(req.user);

    res.redirect(
      `http://localhost:3000?access_token=${token.access_token}&refresh_token=${token.refresh_token}`,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('send-confirm-email')
  async sendConfirmEmail(@Request() req) {
    if (
      (await this._authService.sendConfirmEmail(req.user.email)) === 'success'
    ) {
      return {
        status: 200,
        message: 'Email sent successfully',
      };
    } else {
      return {
        status: 500,
        message: 'Email sent failed',
      };
    }
  }

  @Get('confirm-email')
  async verifyEmail(@Query('token') token: string) {
    return await this._authService.confirmEmail(token);
  }
}

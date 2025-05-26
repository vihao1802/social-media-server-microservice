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
import {
  ResetPasswordDto,
  resetPasswordSchema,
} from './dto/request/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly _authService: AuthService,
    private readonly _userService: UserService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @HttpCode(200)
  @Post('sign-in')
  async SignIn(@Request() req) {
    const token = await this._authService.signIn(req.user);
    return {
      status: 200,
      data: {
        email: req.user.email,
        ...token,
      },
      message: 'Sign in successfully',
    };
  }

  @Post('sign-up')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new zodValidationPipe(CreateUserSchema))
  async SignUp(@Body() body: CreateUserDTO) {
    const user = await this._userService.createUser(body);
    return {
      status: 201,
      data: {
        user,
      },
      message: 'Sign up successfully',
    };
  }

  @UseGuards(RefreshJwtAuthGuard)
  @Post('/refresh-token')
  async RefreshToken(@Request() req) {
    const access_token = await this._authService.refreshToken(
      req.user,
      req.user.role,
    );
    return {
      status: 201,
      data: {
        email: req.user.email,
        ...access_token,
      },
      message: 'Token refreshed ',
    };
  }

  @Post('introspect')
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

    res
      .status(302)
      .redirect(
        `${process.env.CLIENT_DOMAIN}/callback?access_token=${token.access_token}&refresh_token=${token.refresh_token}`,
      );
  }
  @Get('facebook/login')
  @UseGuards(FacebookAuthGuard)
  facebookLogin() {}

  @Get('facebook/callback')
  @UseGuards(FacebookAuthGuard)
  async facebookCallback(@Request() req, @Response() res) {
    const token = await this._authService.signIn(req.user);

    res
      .status(302)
      .redirect(
        `${process.env.CLIENT_DOMAIN}/callback?access_token=${token.access_token}&refresh_token=${token.refresh_token}`,
      );
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(@Request() req) {
    const usr = await this._userService.findOne(req.user.sub);
    return {
      status: 200,
      data: {
        ...usr,
      },
    };
  }
  @UseGuards(JwtAuthGuard)
  @Post('send-confirm-email')
  async sendConfirmEmail(@Request() req) {
    await this._authService.sendVerifyEmail(req.user.email);
    return {
      status: 200,
      message: 'Email sent!',
    };
  }

  @Get('confirm-email')
  async verifyEmail(@Query('token') token: string, @Res() res) {
    await this._authService.confirmEmail(token);
    res.redirect(process.env.CLIENT_DOMAIN);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    await this._authService.forgotPassword(email);
    return {
      status: 200,
      message: 'OTP sent successfully to your email',
    };
  }

  @Post('verify-otp')
  async verifyOtp(@Body('email') email: string, @Body('otp') otp: string) {
    const resetToken = await this._authService.verifyOTP(email, otp);
    if (resetToken) {
      return {
        status: 200,
        data: resetToken.access_token,
        message: 'OTP verified successfully',
      };
    }
  }

  @Post('reset-password')
  @UsePipes(new zodValidationPipe(resetPasswordSchema))
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this._authService.resetPassword(
      resetPasswordDto.resetToken,
      resetPasswordDto.newPassword,
      resetPasswordDto.confirmPassword,
    );
    return {
      status: 200,
      message: 'Password reset successfully',
    };
  }
}

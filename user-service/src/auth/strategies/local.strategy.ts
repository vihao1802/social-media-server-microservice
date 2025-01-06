import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from '../auth.service';
import { UnauthorizedException } from 'src/exception-handler/unauthorized.exception';
import { ErrorCodes } from 'src/exception-handler/error-code.constant';
import { Injectable, UsePipes } from '@nestjs/common';
import { SignInRequest, SignInRequestSchema } from '../dto/request/sign-in.dto';
import { zodValidationPipe } from '../pipes/zodValidationPipe';
import { Strategy } from 'passport-local';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
    constructor(private readonly authService: AuthService) {
        super({
            usernameField: 'email',
        });
    }

    // @UsePipes(new zodValidationPipe(SignInRequestSchema))
    validate(email: string, password: string): Promise<any> {
        const user = this.authService.verifyUser({ email, password });
        if (!user) {
            throw new UnauthorizedException(
                ErrorCodes.UnauthorizedCode.USER_NOT_FOUND,
            );
        }
        return user;
    }
}

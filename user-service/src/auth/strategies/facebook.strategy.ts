import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import facebookOauthConfig from '../config/facebook-oauth.config';
import { VerifiedCallback } from 'passport-jwt';
import { UserService } from 'src/user/user.service';
import { ErrorCodes } from 'src/exception-handler/error-code.constant';
import { BadRequestException } from 'src/exception-handler/bad-request.exception';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(facebookOauthConfig.KEY)
    private facebookConfig: ConfigType<typeof facebookOauthConfig>,
    private readonly userService: UserService,
  ) {
    super({
      clientID: facebookConfig.clientId,
      clientSecret: facebookConfig.clientSecret,
      callbackURL: facebookConfig.callbackURL,
      profileFields: ['displayName', 'photos', 'email', 'gender', 'birthday'],
      scope: ['email', 'user_gender', 'user_birthday'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifiedCallback,
  ) {
    const usr = await this.userService.findByEmail(profile.emails[0].value);
    if (usr) {
      return done(null, usr);
    }
    try {
      const newUser = await this.userService.createUser({
        email: profile.emails[0].value,
        username: profile.displayName,
        profilePicture: profile.photos[0].value,
        dob: new Date(profile._json.birthday),
        gender: profile._json.gender,
        password: '',
      });

      done(null, newUser);
    } catch (error) {
      console.error('error', error);
      throw new BadRequestException(
        ErrorCodes.BadRequestCode.INSUFFICIENT_PERMISSION,
      );
    }
  }
}

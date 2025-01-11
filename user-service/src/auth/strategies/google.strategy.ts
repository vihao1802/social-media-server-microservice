import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import googleOauthConfig from '../config/google-oauth.config';
import { ConfigType } from '@nestjs/config';
import { VerifiedCallback } from 'passport-jwt';
import { UserService } from 'src/user/user.service';
import axios from 'axios';
import { BadRequestException } from 'src/exception-handler/bad-request.exception';
import { ErrorCodes } from 'src/exception-handler/error-code.constant';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(googleOauthConfig.KEY)
    private googleConfig: ConfigType<typeof googleOauthConfig>,
    private readonly userService: UserService,
  ) {
    super({
      clientID: googleConfig.clientId,
      clientSecret: googleConfig.clientSecret,
      callbackURL: googleConfig.callbackURL,
      scope: [
        'email',
        'profile',
        'https://www.googleapis.com/auth/user.birthday.read',
        'https://www.googleapis.com/auth/user.gender.read',
      ],
    });
  }

  async validate(
    access_token: string,
    refresh_token: string,
    profile: any,
    done: VerifiedCallback,
  ) {
    try {
      const { data } = await axios.get(
        'https://people.googleapis.com/v1/people/me?personFields=birthdays,genders',
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      );
      const usr = await this.userService.findByEmail(profile.emails[0].value);
      if (usr) {
        return done(null, usr);
      }
      const dob = new Date(
        `${data.birthdays[0].date.day}/${data.birthdays[0].date.month}/${data.birthdays[0].date.year}`,
      );

      const usrCreate = await this.userService.createUser({
        email: profile.emails[0].value,
        username: profile.displayName,
        profilePicture: profile.photos[0].value,
        dob: dob,
        gender: data.genders[0].value,
        password: '',
      });

      done(null, usrCreate);
    } catch (error: any) {
      console.error('error', error);
      throw new BadRequestException(
        ErrorCodes.BadRequestCode.INSUFFICIENT_PERMISSION,
      );
    }
  }
}

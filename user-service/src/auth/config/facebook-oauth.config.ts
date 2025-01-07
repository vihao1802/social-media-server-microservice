import { registerAs } from '@nestjs/config';

export default registerAs('facebookOAuth', () => ({
  clientId: process.env.FACEBOOK_CLIENT_ID,
  clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
  callbackURL: process.env.FACEBOOK_CALLBACK_URL,
}));

// src/modules/auth/strategies/google.strategy.ts
// Google OAuth 2.0 strategy

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import { AuthResponseDto } from '../dto';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('google.clientId')!,
      clientSecret: configService.get<string>('google.clientSecret')!,
      callbackURL: configService.get<string>('google.callbackUrl')!,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    try {
      const authResponse: AuthResponseDto = await this.authService.handleGoogleAuth({
        oauthId: profile.id,
        email: profile.emails![0].value,
        fullName: `${profile.name?.givenName ?? ''} ${profile.name?.familyName ?? ''}`.trim(),
        avatarUrl: profile.photos?.[0]?.value,
      });
      done(null, authResponse);
    } catch (err) {
      done(err as Error, false);
    }
  }
}

// src/modules/auth/guards/google-oauth.guard.ts
// Google OAuth initiation guard

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {}

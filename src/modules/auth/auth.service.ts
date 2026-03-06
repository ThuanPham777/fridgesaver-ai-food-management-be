// src/modules/auth/auth.service.ts
// Core authentication business logic

import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { PrismaService } from '../../core/prisma';
import {
  BusinessException,
  DuplicateException,
  ForbiddenException,
  UnauthorizedException,
} from '../../common/exceptions';
import { ERROR_CODES } from '../../common/constants';

import type { User } from '../../../generated/prisma/client';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  AuthResponseDto,
  UserProfileDto,
} from './dto';
import { JwtPayload, JwtRefreshPayload, GoogleOAuthUser } from './types/auth.types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Register ────────────────────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new DuplicateException('User', 'email');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone,
      },
    });

    this.logger.log(`User registered: ${user.id}`);
    return this.buildAuthResponse(user);
  }

  // ─── Login ───────────────────────────────────────────────────────────────────

  async login(dto: LoginDto, device?: string): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Email hoặc mật khẩu không đúng');

    if (!user.isActive) throw new ForbiddenException('Tài khoản đã bị vô hiệu hóa');

    this.logger.log(`User logged in: ${user.id}`);
    return this.buildAuthResponse(user, device);
  }

  // ─── Refresh token ───────────────────────────────────────────────────────────

  async refreshToken(userId: string, rawRefreshToken: string, device?: string): Promise<AuthResponseDto> {
    const tokenHash = this.hashToken(rawRefreshToken);

    const stored = await this.prisma.refreshToken.findFirst({
      where: {
        userId,
        tokenHash,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!stored) throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    if (!stored.user.isActive) throw new ForbiddenException('Tài khoản đã bị vô hiệu hóa');

    // Revoke the used token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { isRevoked: true },
    });

    return this.buildAuthResponse(stored.user, device ?? stored.device ?? undefined);
  }

  // ─── Logout ──────────────────────────────────────────────────────────────────

  async logout(userId: string, rawRefreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { userId, tokenHash },
      data: { isRevoked: true },
    });
    this.logger.log(`User logged out: ${userId}`);
  }

  // ─── Forgot password ─────────────────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    // Always return success to avoid leaking email existence
    if (!user || !user.isActive) return;

    // Revoke any existing reset tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id, device: 'password-reset', isRevoked: false },
      data: { isRevoked: true },
    });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await this.prisma.refreshToken.create({
      data: { userId: user.id, tokenHash, device: 'password-reset', expiresAt },
    });

    const frontendUrl = this.configService.get<string>('frontendUrl', 'http://localhost:5173');
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${rawToken}`;

    // TODO: Replace with Nodemailer email sending when email module is implemented
    this.logger.warn(`[DEV] Password reset URL for ${dto.email}: ${resetUrl}`);
  }

  // ─── Reset password ──────────────────────────────────────────────────────────

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const tokenHash = this.hashToken(dto.token);

    const stored = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        device: 'password-reset',
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!stored) {
      throw new BusinessException(
        'Token không hợp lệ hoặc đã hết hạn',
        ERROR_CODES.INVALID_TOKEN,
        HttpStatus.BAD_REQUEST,
      );
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    // Update password + revoke all tokens atomically
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: stored.userId }, data: { passwordHash } });
      await tx.refreshToken.updateMany({
        where: { userId: stored.userId },
        data: { isRevoked: true },
      });
    });

    this.logger.log(`Password reset for user: ${stored.userId}`);
  }

  // ─── Google OAuth ─────────────────────────────────────────────────────────────

  async handleGoogleAuth(profile: GoogleOAuthUser): Promise<AuthResponseDto> {
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { oauthProvider: 'google', oauthId: profile.oauthId },
          { email: profile.email },
        ],
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          fullName: profile.fullName,
          avatarUrl: profile.avatarUrl,
          oauthProvider: 'google',
          oauthId: profile.oauthId,
        },
      });
      this.logger.log(`New user via Google OAuth: ${user.id}`);
    } else if (!user.oauthProvider) {
      // Link Google to existing email account
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { oauthProvider: 'google', oauthId: profile.oauthId },
      });
    }

    if (!user.isActive) throw new ForbiddenException('Tài khoản đã bị vô hiệu hóa');

    return this.buildAuthResponse(user);
  }

  // ─── Get profile ─────────────────────────────────────────────────────────────

  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Người dùng không tồn tại');
    return this.mapToProfile(user);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async buildAuthResponse(user: User, device?: string): Promise<AuthResponseDto> {
    const { accessToken, refreshToken } = this.generateTokens(user.id, user.role, user.email);
    await this.saveRefreshToken(user.id, refreshToken, device);
    return { accessToken, refreshToken, user: this.mapToProfile(user) };
  }

  private generateTokens(userId: string, role: string, email: string) {
    const accessPayload: JwtPayload = { sub: userId, role: role as any, email, type: 'access' };
    const refreshPayload: JwtRefreshPayload = { sub: userId, type: 'refresh' };

    const accessToken = this.jwtService.sign(accessPayload, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expiresIn: this.configService.get<string>('jwt.accessExpiresIn', '15m') as any,
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn', '7d') as any,
    });

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: string, refreshToken: string, device?: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    const expiresInStr = this.configService.get<string>('jwt.refreshExpiresIn', '7d');
    const expiresAt = this.parseExpiresAt(expiresInStr);
    // Truncate User-Agent to match the DB column limit
    const deviceTruncated = device ? device.slice(0, 500) : undefined;

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, device: deviceTruncated, expiresAt },
    });
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private parseExpiresAt(expiresIn: string): Date {
    const now = Date.now();
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return new Date(now + 7 * 24 * 60 * 60 * 1000);

    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };

    return new Date(now + value * (multipliers[unit] ?? 86_400_000));
  }

  private mapToProfile(user: User): UserProfileDto {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
      address: user.address,
      language: user.language,
      createdAt: user.createdAt,
    };
  }
}

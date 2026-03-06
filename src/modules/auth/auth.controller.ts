// src/modules/auth/auth.controller.ts

import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response, CookieOptions } from 'express';
import { ConfigService } from '@nestjs/config';

import { Public } from '../../common/decorators';
import { ApiResponseDto } from '../../common/dto';

import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  AuthResponseDto,
} from './dto';
import { JwtRefreshGuard, GoogleOAuthGuard } from './guards';
import { CurrentUser } from './decorators';
import type { RequestUser } from './types/auth.types';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  private readonly REFRESH_COOKIE = 'refreshToken';

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Cookie helpers ─────────────────────────────────────────────────────────

  private refreshCookieOptions(): CookieOptions {
    const isProduction = this.configService.get<string>('nodeEnv') === 'production';
    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    };
  }

  private setRefreshCookie(res: Response, refreshToken: string): void {
    res.cookie(this.REFRESH_COOKIE, refreshToken, this.refreshCookieOptions());
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(this.REFRESH_COOKIE, { path: '/' });
  }

  // ─── Register ───────────────────────────────────────────────────────────────

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } = await this.authService.register(dto);
    this.setRefreshCookie(res, refreshToken);
    return ApiResponseDto.success({ accessToken, user }, 'Đăng ký thành công');
  }

  // ─── Login ──────────────────────────────────────────────────────────────────

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const device = req.headers['user-agent'];
    const { accessToken, refreshToken, user } = await this.authService.login(dto, device);
    this.setRefreshCookie(res, refreshToken);
    return ApiResponseDto.success({ accessToken, user }, 'Đăng nhập thành công');
  }

  // ─── Refresh token ──────────────────────────────────────────────────────────

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @ApiOperation({ summary: 'Làm mới access token' })
  async refresh(
    @Req() req: Request & { user: { userId: string; refreshToken: string; device?: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { userId, refreshToken, device } = req.user;
    const result = await this.authService.refreshToken(userId, refreshToken, device);
    this.setRefreshCookie(res, result.refreshToken);
    return ApiResponseDto.success({ accessToken: result.accessToken, user: result.user }, 'Token đã được làm mới');
  }

  // ─── Logout ─────────────────────────────────────────────────────────────────

  @Post('logout')
  @ApiOperation({ summary: 'Đăng xuất' })
  async logout(
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawRefreshToken: string | undefined = req.cookies?.[this.REFRESH_COOKIE];
    this.clearRefreshCookie(res);
    if (rawRefreshToken) {
      await this.authService.logout(user.userId, rawRefreshToken);
    }
    return ApiResponseDto.success(null, 'Đăng xuất thành công');
  }

  // ─── Forgot password ────────────────────────────────────────────────────────

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Yêu cầu đặt lại mật khẩu' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto);
    return ApiResponseDto.success(null, 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi');
  }

  // ─── Reset password ─────────────────────────────────────────────────────────

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Đặt lại mật khẩu' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto);
    return ApiResponseDto.success(null, 'Mật khẩu đã được đặt lại thành công');
  }

  // ─── Google OAuth ───────────────────────────────────────────────────────────

  @Public()
  @UseGuards(GoogleOAuthGuard)
  @Get('google')
  @ApiOperation({ summary: 'Đăng nhập bằng Google' })
  googleLogin() {
    // Passport handles the redirect to Google
  }

  @Public()
  @UseGuards(GoogleOAuthGuard)
  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(
    @Req() req: Request & { user: AuthResponseDto },
    @Res() res: Response,
  ) {
    const frontendUrl = this.configService.get<string>('frontendUrl', 'http://localhost:5173');
    const { accessToken, refreshToken } = req.user;
    // Set refresh token as HttpOnly cookie before redirecting to frontend
    this.setRefreshCookie(res, refreshToken);
    return res.redirect(`${frontendUrl}/auth/oauth/callback?accessToken=${accessToken}`);
  }

  // ─── Current user ────────────────────────────────────────────────────────────

  @Get('me')
  @ApiOperation({ summary: 'Lấy thông tin người dùng hiện tại' })
  async me(@CurrentUser() user: RequestUser) {
    const data = await this.authService.getProfile(user.userId);
    return ApiResponseDto.success(data, 'Lấy thông tin thành công');
  }
}

import { Body, Controller, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response, CookieOptions } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private get isCookieSecure() {
    return (
      this.configService.get('COOKIE_SECURE') === 'true' ||
      this.configService.get('NODE_ENV') === 'production'
    );
  }

  private get sameSite(): CookieOptions['sameSite'] {
    const value = this.configService
      .get<string>('COOKIE_SAME_SITE', 'lax')
      .toLowerCase();

    return value === 'strict' || value === 'none' ? value : 'lax';
  }

  private getCookieOptions(maxAge: number): CookieOptions {
    return {
      httpOnly: true,
      sameSite: this.sameSite,
      secure: this.isCookieSecure,
      path: '/',
      maxAge,
    };
  }

  private parseTokenTtl(value: unknown, fallbackMs: number) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value * 1000;
    }

    if (typeof value !== 'string') {
      return fallbackMs;
    }

    const match = value.trim().match(/^(\d+(?:\.\d+)?)(ms|s|m|h|d|w)?$/i);

    if (!match) {
      return fallbackMs;
    }

    const amount = Number(match[1]);
    const unit = match[2]?.toLowerCase() ?? 's';
    const multipliers: Record<string, number> = {
      ms: 1,
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
      w: 7 * 24 * 60 * 60 * 1000,
    };

    return amount * multipliers[unit];
  }

  private getCookieValue(req: Request, name: string) {
    const cookieHeader = req.headers.cookie;

    if (!cookieHeader) {
      return undefined;
    }

    return cookieHeader
      .split(';')
      .map((cookie) => cookie.trim())
      .map((cookie) => {
        const separatorIndex = cookie.indexOf('=');

        if (separatorIndex === -1) {
          return null;
        }

        return {
          name: cookie.slice(0, separatorIndex),
          value: cookie.slice(separatorIndex + 1),
        };
      })
      .filter((cookie): cookie is { name: string; value: string } =>
        Boolean(cookie),
      )
      .find((cookie) => cookie.name === name)?.value;
  }

  private getRefreshToken(req: Request) {
    const refreshToken = this.getCookieValue(req, REFRESH_TOKEN_COOKIE);

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    return refreshToken;
  }

  private setAuthCookies(res: Response, tokens: AuthTokens) {
    const accessTokenMaxAge = this.parseTokenTtl(
      this.authService.accessTokenExpiresIn,
      7 * 24 * 60 * 60 * 1000,
    );
    const refreshTokenMaxAge = this.parseTokenTtl(
      this.authService.refreshTokenExpiresIn,
      30 * 24 * 60 * 60 * 1000,
    );

    res.cookie(
      ACCESS_TOKEN_COOKIE,
      tokens.accessToken,
      this.getCookieOptions(accessTokenMaxAge),
    );
    res.cookie(
      REFRESH_TOKEN_COOKIE,
      tokens.refreshToken,
      this.getCookieOptions(refreshTokenMaxAge),
    );
  }

  private clearAuthCookies(res: Response) {
    const options = this.getCookieOptions(0);

    res.clearCookie(ACCESS_TOKEN_COOKIE, options);
    res.clearCookie(REFRESH_TOKEN_COOKIE, options);
  }

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const authData = await this.authService.register(dto);
    this.setAuthCookies(res, authData);

    return authData;
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const authData = await this.authService.login(dto);
    this.setAuthCookies(res, authData);

    return authData;
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const authData = await this.authService.refresh(this.getRefreshToken(req));
    this.setAuthCookies(res, authData);

    return authData;
  }

  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.logout(this.getRefreshToken(req));
    this.clearAuthCookies(res);

    return result;
  }
}

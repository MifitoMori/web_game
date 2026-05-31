import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { SignOptions } from 'jsonwebtoken';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { createHash } from 'crypto';
import { Role } from '@prisma/client';
import { LoggerService } from '../../common/logger/logger.service';

type AuthPayload = {
  sub: number;
  login: string;
  role: Role;
};

@Injectable()
export class AuthService {
  private readonly logger: LoggerService;
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    logger: LoggerService,
  ) {
    this.logger = logger.child('AuthService');
  }

  get accessTokenExpiresIn() {
    return this.configService.get<SignOptions['expiresIn']>(
      'JWT_EXPIRES_IN',
      '7d',
    );
  }

  get refreshTokenSecret() {
    return this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      this.configService.get<string>('JWT_SECRET', 'dev-secret-key'),
    );
  }

  get refreshTokenExpiresIn() {
    return this.configService.get<SignOptions['expiresIn']>(
      'JWT_REFRESH_EXPIRES_IN',
      '30d',
    );
  }

  private hashRefreshToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async buildAuthResponse(user: {
    id: number;
    email: string;
    login: string;
    firstName: string;
    secondName: string;
    gender: string;
    birthDate: Date;
    avatarUrl: string | null;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
    profile?: {
      id: number;
      totalGames: number;
      wins: number;
      losses: number;
      credits: number;
      experience: number;
      level: number;
    };
  }) {
    const payload: AuthPayload = {
      sub: user.id,
      login: user.login,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.accessTokenExpiresIn,
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.refreshTokenSecret,
      expiresIn: this.refreshTokenExpiresIn,
    });

    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    await this.usersService.updateRefreshTokenHash(user.id, refreshTokenHash);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        login: user.login,
        firstName: user.firstName,
        secondName: user.secondName,
        gender: user.gender,
        birthDate: user.birthDate,
        avatarUrl: user.avatarUrl,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        profile: user.profile,
      },
    };
  }

  async register(dto: RegisterDto) {
    this.logger.debug(`Начало регистрации: ${dto.login}`);

    const existingByEmail = await this.usersService.findByEmail(dto.email);
    if (existingByEmail) {
      this.logger.warn(`Регистрация отклонена: email ${dto.email} уже существует`);
      throw new BadRequestException(
        'Пользователь с таким email уже существует',
      );
    }

    const existingByLogin = await this.usersService.findByLogin(dto.login);
    if (existingByLogin) {
      this.logger.warn(`Регистрация отклонена: login ${dto.login} уже существует`);
      throw new BadRequestException(
        'Пользователь с таким login уже существует',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      email: dto.email,
      login: dto.login,
      passwordHash,
      firstName: dto.firstName,
      secondName: dto.secondName,
      gender: dto.gender,
      birthDate: new Date(dto.birthDate),
    });

    this.logger.log(`Пользователь создан: ID ${user.id}, login ${user.login}`);

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByLogin(dto.login);

    if (!user) {
      this.logger.warn(`Неудачный вход: пользователь ${dto.login} не найден`);
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      this.logger.warn(`Неудачный вход: неверный пароль для ${dto.login}`);
      throw new UnauthorizedException('Неверный логин или пароль');
    }
    
    this.logger.log(`Успешный вход: ${dto.login} (ID: ${user.id})`);
    return this.buildAuthResponse(user);
  }

  async refresh(refreshToken: string) {
    let payload: AuthPayload;

    try {
      payload = await this.jwtService.verifyAsync<AuthPayload>(refreshToken, {
        secret: this.refreshTokenSecret,
      });
    } catch {
      throw new UnauthorizedException('Недействительный refresh token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token отозван');
    }

    const isRefreshTokenValid =
      this.hashRefreshToken(refreshToken) === user.refreshTokenHash;

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Недействительный refresh token');
    }

    return this.buildAuthResponse(user);
  }

  async logout(refreshToken: string) {
    let payload: AuthPayload;

    try {
      payload = await this.jwtService.verifyAsync<AuthPayload>(refreshToken, {
        secret: this.refreshTokenSecret,
      });
    } catch {
      throw new UnauthorizedException('Недействительный refresh token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token уже отозван');
    }

    const isRefreshTokenValid =
      this.hashRefreshToken(refreshToken) === user.refreshTokenHash;

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Недействительный refresh token');
    }

    await this.usersService.updateRefreshTokenHash(payload.sub, null);

    return {
      success: true,
    };
  }
}

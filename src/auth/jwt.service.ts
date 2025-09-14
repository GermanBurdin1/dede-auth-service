import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/user.entity';
import { JwtResponseDto } from './dto/jwt-response.dto';

@Injectable()
export class JwtAuthService {
  constructor(private readonly jwtService: JwtService) {}

  async generateTokens(user: User): Promise<JwtResponseDto> {
    const payload = {
      sub: user.id_users,
      email: user.email,
      roles: user.roles,
      name: user.name,
      surname: user.surname,
    };

    // Access token (короткий срок жизни - 15 минут)
    const access_token = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });

    // Refresh token (длинный срок жизни - 7 дней)
    const refresh_token = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id_users,
        email: user.email,
        roles: user.roles,
        name: user.name,
        surname: user.surname,
        isEmailConfirmed: user.is_email_confirmed,
      },
      expires_in: 900, // 15 минут в секундах
    };
  }

  async verifyToken(token: string): Promise<any> {
    try {
      return await this.jwtService.verifyAsync(token);
    } catch {
      throw new Error('Invalid token');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken);
      
      // Создаем новый access token с тем же payload
      const access_token = await this.jwtService.signAsync({
        sub: payload.sub,
        email: payload.email,
        roles: payload.roles,
        name: payload.name,
        surname: payload.surname,
      }, {
        expiresIn: '15m',
      });

      return {
        access_token,
        expires_in: 900,
      };
    } catch {
      throw new Error('Invalid refresh token');
    }
  }
}

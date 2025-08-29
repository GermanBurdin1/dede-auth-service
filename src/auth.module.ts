import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { UsersModule } from './users/users.module';
import { TeacherProfileModule } from './users/teacher/teacher-profile.module';
import { MailService } from './services/mail.service';
import { JwtAuthService } from './auth/jwt.service';
import { JwtAuthGuard } from './auth/jwt.guard';
import { RolesGuard } from './auth/roles.guard';

@Module({
  imports: [
    UsersModule, 
    TeacherProfileModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-super-secret-jwt-key-change-in-production',
        signOptions: {
          expiresIn: '15m', // по умолчанию для access токенов
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [MailService, JwtAuthService, JwtAuthGuard, RolesGuard],
  exports: [JwtAuthService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}

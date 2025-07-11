import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { UsersModule } from './users/users.module';
import { TeacherProfileModule } from './users/teacher/teacher-profile.module';
import { MailService } from './services/mail.service';
// import { GoogleStrategy } from './auth/google.strategy';

@Module({
  imports: [UsersModule, TeacherProfileModule],
  controllers: [AuthController],
  providers: [MailService]
})
export class AuthModule {}

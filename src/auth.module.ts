import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { UsersModule } from './users/users.module';
import { TeacherProfileModule } from './users/teacher/teacher-profile.module';
// import { GoogleStrategy } from './auth/google.strategy';

@Module({
  imports: [UsersModule,TeacherProfileModule],
  controllers: [AuthController],
  providers: []
})
export class AuthModule {}

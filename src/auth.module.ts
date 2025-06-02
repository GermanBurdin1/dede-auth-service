import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { UsersModule } from './users/users.module';
import { TeacherProfileModule } from './users/teacher/teacher-profile.module';

@Module({
  imports: [UsersModule,TeacherProfileModule],
  controllers: [AuthController]
})
export class AuthModule {}

import { Module } from '@nestjs/common';
import { EmailController } from './email.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [EmailController],
})
export class EmailModule {}

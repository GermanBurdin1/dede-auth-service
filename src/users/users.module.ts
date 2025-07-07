import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { MailService } from '../services/mail.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService, MailService],
  exports: [UsersService, MailService],
})
export class UsersModule {}

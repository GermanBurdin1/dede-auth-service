import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import { Logger } from '@nestjs/common';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async createUser(email: string, password: string, roles: string[]): Promise<User> {
    this.logger.log(`Hashing password for ${email}`);
    const hash = await bcrypt.hash(password, 10);
    
    const user = this.userRepo.create({
      email,
      password: hash,
      roles,
      is_active: true,
    });

    this.logger.log(`Saving user to database: ${email}`);
    return this.userRepo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    this.logger.log(`Looking for user with email: ${email}`);
    return this.userRepo.findOne({ where: { email } });
  }
}
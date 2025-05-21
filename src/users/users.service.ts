import { BadRequestException, Injectable } from '@nestjs/common';
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

  async createOrUpdateUser(email: string, password: string, roles: string[]): Promise<User> {
  const existing = await this.userRepo.findOne({ where: { email } });

  if (existing) {
    const existingRoles = existing.roles || [];
    const newRoles = roles.filter(role => !existingRoles.includes(role));
    
    if (newRoles.length === 0) {
      throw new BadRequestException('Вы уже зарегистрированы с этой ролью');
    }

    if (existingRoles.length + newRoles.length > 2) {
      throw new BadRequestException('Нельзя добавить более двух ролей для одного пользователя');
    }

    existing.roles = [...existingRoles, ...newRoles];
    return this.userRepo.save(existing);
  }

  // Новый пользователь
  const hash = await bcrypt.hash(password, 10);
  const user = this.userRepo.create({
    email,
    password: hash,
    roles,
    is_active: true,
  });

  return this.userRepo.save(user);
}


  async findByEmail(email: string): Promise<User | null> {
    this.logger.log(`Looking for user with email: ${email}`);
    return this.userRepo.findOne({ where: { email } });
  }
}
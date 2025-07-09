import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<Repository<User>>;

  const mockUser: Partial<User> = {
    id_users: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    password: 'hashedPassword123',
    roles: ['student'],
    name: 'John',
    surname: 'Doe',
    is_active: true,
    is_email_confirmed: false,
    created_at: new Date(),
  };

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      query: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn(),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrUpdateUser', () => {
    const createUserDto = {
      email: 'test@example.com',
      password: 'password123',
      roles: ['student'],
      name: 'John',
      surname: 'Doe',
    };

    it('should create a new user successfully', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(mockUser as User);
      userRepository.save.mockResolvedValue(mockUser as User);
      mockBcrypt.hash.mockResolvedValue('hashedPassword123' as never);

      // Act
      const result = await service.createOrUpdateUser(
        createUserDto.email,
        createUserDto.password,
        createUserDto.roles,
        createUserDto.name,
        createUserDto.surname,
      );

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: createUserDto.email } });
      expect(mockBcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(userRepository.create).toHaveBeenCalledWith({
        email: createUserDto.email,
        password: 'hashedPassword123',
        roles: createUserDto.roles,
        name: createUserDto.name,
        surname: createUserDto.surname,
        is_active: true,
        is_email_confirmed: false,
      });
      expect(userRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should update existing user with new roles', async () => {
      // Arrange
      const existingUser = { ...mockUser, roles: ['student'] };
      const updatedUser = { ...existingUser, roles: ['student', 'teacher'] };
      userRepository.findOne.mockResolvedValue(existingUser as User);
      userRepository.save.mockResolvedValue(updatedUser as User);

      // Act
      const result = await service.createOrUpdateUser(
        createUserDto.email,
        createUserDto.password,
        ['teacher'],
        createUserDto.name,
        createUserDto.surname,
      );

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: createUserDto.email } });
      expect(userRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        roles: ['student', 'teacher'],
      }));
      expect(result).toEqual(updatedUser);
    });

    it('should throw BadRequestException when user already has the role', async () => {
      // Arrange
      const existingUser = { ...mockUser, roles: ['student'] };
      userRepository.findOne.mockResolvedValue(existingUser as User);

      // Act & Assert
      await expect(
        service.createOrUpdateUser(
          createUserDto.email,
          createUserDto.password,
          ['student'],
          createUserDto.name,
          createUserDto.surname,
        )
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createOrUpdateUser(
          createUserDto.email,
          createUserDto.password,
          ['student'],
          createUserDto.name,
          createUserDto.surname,
        )
      ).rejects.toThrow('Вы уже зарегистрированы с этой ролью');
    });

    it('should throw BadRequestException when trying to add more than 2 roles', async () => {
      // Arrange
      const existingUser = { ...mockUser, roles: ['student', 'teacher'] };
      userRepository.findOne.mockResolvedValue(existingUser as User);

      // Act & Assert
      await expect(
        service.createOrUpdateUser(
          createUserDto.email,
          createUserDto.password,
          ['admin'],
          createUserDto.name,
          createUserDto.surname,
        )
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createOrUpdateUser(
          createUserDto.email,
          createUserDto.password,
          ['admin'],
          createUserDto.name,
          createUserDto.surname,
        )
      ).rejects.toThrow('Нельзя добавить более двух ролей для одного пользователя');
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser as User);

      // Act
      const result = await service.findByEmail('test@example.com');

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.findByEmail('nonexistent@example.com');

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: 'nonexistent@example.com' } });
      expect(result).toBeNull();
    });
  });

  describe('confirmEmail', () => {
    it('should confirm email successfully', async () => {
      // Arrange
      const user = { ...mockUser, is_email_confirmed: false };
      userRepository.findOne.mockResolvedValue(user as User);
      userRepository.save.mockResolvedValue({ ...user, is_email_confirmed: true } as User);

      // Act
      const result = await service.confirmEmail('test@example.com');

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(userRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        is_email_confirmed: true,
      }));
      expect(result).toBe(true);
    });

    it('should return true if email already confirmed', async () => {
      // Arrange
      const user = { ...mockUser, is_email_confirmed: true };
      userRepository.findOne.mockResolvedValue(user as User);

      // Act
      const result = await service.confirmEmail('test@example.com');

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(userRepository.save).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when user not found', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.confirmEmail('nonexistent@example.com');

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: 'nonexistent@example.com' } });
      expect(userRepository.save).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should return false on database error', async () => {
      // Arrange
      userRepository.findOne.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await service.confirmEmail('test@example.com');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('isEmailConfirmed', () => {
    it('should return true when email is confirmed', async () => {
      // Arrange
      const user = { ...mockUser, is_email_confirmed: true };
      userRepository.findOne.mockResolvedValue(user as User);

      // Act
      const result = await service.isEmailConfirmed('test@example.com');

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(result).toBe(true);
    });

    it('should return false when email is not confirmed', async () => {
      // Arrange
      const user = { ...mockUser, is_email_confirmed: false };
      userRepository.findOne.mockResolvedValue(user as User);

      // Act
      const result = await service.isEmailConfirmed('test@example.com');

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(result).toBe(false);
    });

    it('should return false when user not found', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.isEmailConfirmed('nonexistent@example.com');

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: 'nonexistent@example.com' } });
      expect(result).toBe(false);
    });

    it('should return false on database error', async () => {
      // Arrange
      userRepository.findOne.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await service.isEmailConfirmed('test@example.com');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('sendConfirmationEmail', () => {
    it('should return true when user exists and email not confirmed', async () => {
      // Arrange
      const user = { ...mockUser, is_email_confirmed: false };
      userRepository.findOne.mockResolvedValue(user as User);

      // Act
      const result = await service.sendConfirmationEmail('test@example.com');

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(result).toBe(true);
    });

    it('should return true when email already confirmed', async () => {
      // Arrange
      const user = { ...mockUser, is_email_confirmed: true };
      userRepository.findOne.mockResolvedValue(user as User);

      // Act
      const result = await service.sendConfirmationEmail('test@example.com');

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(result).toBe(true);
    });

    it('should return false when user not found', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.sendConfirmationEmail('nonexistent@example.com');

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: 'nonexistent@example.com' } });
      expect(result).toBe(false);
    });
  });

  describe('getUserRegistrationStats', () => {
    it('should return registration statistics', async () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const mockStats = [{
        student_count: '10',
        teacher_count: '5',
        confirmed_emails_count: '12',
      }];
      userRepository.query.mockResolvedValue(mockStats);

      // Act
      const result = await service.getUserRegistrationStats(startDate, endDate);

      // Assert
      expect(userRepository.query).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(*) FILTER (WHERE'),
        [startDate, endDate]
      );
      expect(result).toEqual({
        newStudents: 10,
        newTeachers: 5,
        confirmedEmails: 12,
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      userRepository.query.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await service.getUserRegistrationStats(startDate, endDate);

      // Assert
      expect(result).toEqual({
        newStudents: 0,
        newTeachers: 0,
        confirmedEmails: 0,
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });
    });
  });
});

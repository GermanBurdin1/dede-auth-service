import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { UsersService } from './users/users.service';
import { TeacherProfileService } from './users/teacher/teacher-profile.service';
import { MailService } from './services/mail.service';
import { User } from './users/user.entity';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthController', () => {
  let controller: AuthController;
  let usersService: jest.Mocked<UsersService>;
  let teacherProfileService: jest.Mocked<TeacherProfileService>;
  let mailService: jest.Mocked<MailService>;

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
    // Create mock services
    const mockUsersService = {
      createOrUpdateUser: jest.fn(),
      findByEmail: jest.fn(),
      confirmEmail: jest.fn(),
      isEmailConfirmed: jest.fn(),
      sendConfirmationEmail: jest.fn(),
      findTeachersPaginated: jest.fn(),
      getUserFullInfo: jest.fn(),
      getBasicInfo: jest.fn(),
      getUserRegistrationStats: jest.fn(),
      save: jest.fn(),
    };

    const mockTeacherProfileService = {
      getFullProfileByUserId: jest.fn(),
    };

    const mockMailService = {
      sendVerificationEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: TeacherProfileService,
          useValue: mockTeacherProfileService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    usersService = module.get(UsersService);
    teacherProfileService = module.get(TeacherProfileService);
    mailService = module.get(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'password123',
      roles: ['student'],
      name: 'John',
      surname: 'Doe',
    };

    it('should register a new user successfully', async () => {
      // Arrange
      const createdUser = { ...mockUser, ...registerDto };
      usersService.createOrUpdateUser.mockResolvedValue(createdUser as User);
      mailService.sendVerificationEmail.mockResolvedValue(undefined);

      // Act
      const result = await controller.register(registerDto);

      // Assert
      expect(usersService.createOrUpdateUser).toHaveBeenCalledWith(
        registerDto.email,
        registerDto.password,
        registerDto.roles,
        registerDto.name,
        registerDto.surname,
      );
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        registerDto.email,
        expect.any(String), // confirmation token
      );
      expect(result).toEqual({
        id: createdUser.id_users,
        email: createdUser.email,
        roles: createdUser.roles,
        name: createdUser.name,
        surname: createdUser.surname,
        isEmailConfirmed: createdUser.is_email_confirmed,
      });
    });

    it('should handle mail service errors gracefully', async () => {
      // Arrange
      const createdUser = { ...mockUser, ...registerDto };
      usersService.createOrUpdateUser.mockResolvedValue(createdUser as User);
      mailService.sendVerificationEmail.mockRejectedValue(new Error('SMTP error'));

      // Act
      const result = await controller.register(registerDto);

      // Assert
      expect(usersService.createOrUpdateUser).toHaveBeenCalled();
      expect(mailService.sendVerificationEmail).toHaveBeenCalled();
      // Registration should still succeed even if email fails
      expect(result).toEqual({
        id: createdUser.id_users,
        email: createdUser.email,
        roles: createdUser.roles,
        name: createdUser.name,
        surname: createdUser.surname,
        isEmailConfirmed: createdUser.is_email_confirmed,
      });
    });

    it('should not send confirmation email if user is already confirmed', async () => {
      // Arrange
      const confirmedUser = { ...mockUser, ...registerDto, is_email_confirmed: true };
      usersService.createOrUpdateUser.mockResolvedValue(confirmedUser as User);

      // Act
      const result = await controller.register(registerDto);

      // Assert
      expect(usersService.createOrUpdateUser).toHaveBeenCalled();
      expect(mailService.sendVerificationEmail).not.toHaveBeenCalled();
      expect(result.isEmailConfirmed).toBe(true);
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user successfully with correct credentials', async () => {
      // Arrange
      const user = { ...mockUser };
      usersService.findByEmail.mockResolvedValue(user as User);
      mockBcrypt.compare.mockResolvedValue(true as never);

      // Act
      const result = await controller.login(loginDto);

      // Assert
      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(mockBcrypt.compare).toHaveBeenCalledWith(loginDto.password, user.password);
      expect(result).toEqual({
        id: user.id_users,
        email: user.email,
        roles: user.roles,
        name: user.name,
        surname: user.surname,
        isEmailConfirmed: user.is_email_confirmed,
      });
    });

    it('should throw BadRequestException when user not found', async () => {
      // Arrange
      usersService.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.login(loginDto)).rejects.toThrow(BadRequestException);
      await expect(controller.login(loginDto)).rejects.toThrow('Utilisateur non trouvé');
      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(mockBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when password is incorrect', async () => {
      // Arrange
      const user = { ...mockUser };
      usersService.findByEmail.mockResolvedValue(user as User);
      mockBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(controller.login(loginDto)).rejects.toThrow(BadRequestException);
      await expect(controller.login(loginDto)).rejects.toThrow('Mot de passe incorrect');
      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(mockBcrypt.compare).toHaveBeenCalledWith(loginDto.password, user.password);
    });
  });

  describe('confirmEmail', () => {
    const confirmEmailDto = {
      email: 'test@example.com',
      token: 'some-token',
    };

    it('should confirm email successfully', async () => {
      // Arrange
      usersService.confirmEmail.mockResolvedValue(true);

      // Act
      const result = await controller.confirmEmail(confirmEmailDto);

      // Assert
      expect(usersService.confirmEmail).toHaveBeenCalledWith(confirmEmailDto.email);
      expect(result).toEqual({
        success: true,
        message: 'Email confirmed successfully',
      });
    });

    it('should handle confirmation failure', async () => {
      // Arrange
      usersService.confirmEmail.mockResolvedValue(false);

      // Act & Assert
      await expect(controller.confirmEmail(confirmEmailDto)).rejects.toThrow(BadRequestException);
      await expect(controller.confirmEmail(confirmEmailDto)).rejects.toThrow('Failed to confirm email');
    });

    it('should handle confirmation errors', async () => {
      // Arrange
      usersService.confirmEmail.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(controller.confirmEmail(confirmEmailDto)).rejects.toThrow(BadRequestException);
      await expect(controller.confirmEmail(confirmEmailDto)).rejects.toThrow('Email confirmation failed');
    });
  });

  describe('resendConfirmation', () => {
    const resendDto = {
      email: 'test@example.com',
    };

    it('should resend confirmation email successfully', async () => {
      // Arrange
      const user = { ...mockUser };
      usersService.findByEmail.mockResolvedValue(user as User);
      mailService.sendVerificationEmail.mockResolvedValue(undefined);

      // Act
      const result = await controller.resendConfirmation(resendDto);

      // Assert
      expect(usersService.findByEmail).toHaveBeenCalledWith(resendDto.email);
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        resendDto.email,
        expect.any(String),
      );
      expect(result).toEqual({
        success: true,
        message: 'Confirmation email sent',
      });
    });

    it('should return success if email already confirmed', async () => {
      // Arrange
      const confirmedUser = { ...mockUser, is_email_confirmed: true };
      usersService.findByEmail.mockResolvedValue(confirmedUser as User);

      // Act
      const result = await controller.resendConfirmation(resendDto);

      // Assert
      expect(usersService.findByEmail).toHaveBeenCalledWith(resendDto.email);
      expect(mailService.sendVerificationEmail).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Email already confirmed',
      });
    });

    it('should throw BadRequestException when user not found', async () => {
      // Arrange
      usersService.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.resendConfirmation(resendDto)).rejects.toThrow(BadRequestException);
      await expect(controller.resendConfirmation(resendDto)).rejects.toThrow('Utilisateur non trouvé');
    });
  });

  describe('checkEmail', () => {
    it('should return user info when email exists', async () => {
      // Arrange
      const user = { ...mockUser };
      usersService.findByEmail.mockResolvedValue(user as User);

      // Act
      const result = await controller.checkEmail(user.email);

      // Assert
      expect(usersService.findByEmail).toHaveBeenCalledWith(user.email);
      expect(result).toEqual({
        exists: true,
        roles: user.roles,
        isEmailConfirmed: user.is_email_confirmed,
      });
    });

    it('should return exists false when email not found', async () => {
      // Arrange
      usersService.findByEmail.mockResolvedValue(null);

      // Act
      const result = await controller.checkEmail('nonexistent@example.com');

      // Assert
      expect(usersService.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(result).toEqual({
        exists: false,
      });
    });
  });
}); 
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<Repository<User>>;

  const mockUser: User = {
    id_users: 'uuid-123',
    email: 'test@example.com',
    password: 'hashed-password',
    is_active: true,
    is_email_confirmed: false,
    roles: ['student'],
    created_at: new Date(),
    name: 'John',
    surname: 'Doe',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            query: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrUpdateUser', () => {
    it('should create a new user if not exists', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue(mockUser);
      repo.save.mockResolvedValue(mockUser);

      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashed-password'));



      const result = await service.createOrUpdateUser('test@example.com', 'pass123', ['student'], 'John', 'Doe');
      expect(repo.create).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should update existing user roles', async () => {
      repo.findOne.mockResolvedValue({ ...mockUser, roles: ['student'], save: jest.fn() } as any);

      const updatedUser = { ...mockUser, roles: ['student', 'teacher'] };
      repo.save.mockResolvedValue(updatedUser);

      const result = await service.createOrUpdateUser('test@example.com', 'pass123', ['teacher'], 'John', 'Doe');
      expect(result.roles).toContain('teacher');
    });

    it('should throw if trying to add duplicate role', async () => {
      repo.findOne.mockResolvedValue({ ...mockUser, roles: ['student'] } as any);

      await expect(
        service.createOrUpdateUser('test@example.com', 'pass123', ['student'], 'John', 'Doe'),
      ).rejects.toThrow('Вы уже зарегистрированы с этой ролью');
    });

    it('should throw if trying to add more than two roles', async () => {
      repo.findOne.mockResolvedValue({ ...mockUser, roles: ['student', 'teacher'] } as any);

      await expect(
        service.createOrUpdateUser('test@example.com', 'pass123', ['admin'], 'John', 'Doe'),
      ).rejects.toThrow('Нельзя добавить более двух ролей для одного пользователя');
    });
  });

  it('should confirm email', async () => {
    repo.findOne.mockResolvedValue({ ...mockUser, is_email_confirmed: false } as any);
    repo.save.mockResolvedValue({ ...mockUser, is_email_confirmed: true });

    const result = await service.confirmEmail('test@example.com');
    expect(result).toBe(true);
  });

  it('should return false if user not found when confirming email', async () => {
    repo.findOne.mockResolvedValue(null);
    const result = await service.confirmEmail('test@example.com');
    expect(result).toBe(false);
  });

  it('should check if email is confirmed', async () => {
    repo.findOne.mockResolvedValue({ ...mockUser, is_email_confirmed: true });
    const result = await service.isEmailConfirmed('test@example.com');
    expect(result).toBe(true);
  });

  it('should return false if email not confirmed or not found', async () => {
    repo.findOne.mockResolvedValue(null);
    const result = await service.isEmailConfirmed('test@example.com');
    expect(result).toBe(false);
  });

  it('should send confirmation email logic (returns true)', async () => {
    repo.findOne.mockResolvedValue({ ...mockUser, is_email_confirmed: false });
    const result = await service.sendConfirmationEmail('test@example.com');
    expect(result).toBe(true);
  });

  it('should return true if email already confirmed when sending confirmation email', async () => {
    repo.findOne.mockResolvedValue({ ...mockUser, is_email_confirmed: true });
    const result = await service.sendConfirmationEmail('test@example.com');
    expect(result).toBe(true);
  });

  it('should get user by email', async () => {
    repo.findOne.mockResolvedValue(mockUser);
    const result = await service.findByEmail('test@example.com');
    expect(result).toEqual(mockUser);
  });

  it('should get user registration stats', async () => {
    repo.query.mockResolvedValue([
      {
        student_count: '5',
        teacher_count: '3',
        confirmed_emails_count: '6',
      },
    ]);

    const startDate = new Date();
    const endDate = new Date();
    const result = await service.getUserRegistrationStats(startDate, endDate);

    expect(result.newStudents).toBe(5);
    expect(result.newTeachers).toBe(3);
    expect(result.confirmedEmails).toBe(6);
  });

  it('should getUserFullInfo', async () => {
    repo.query.mockResolvedValue([{ id_users: 'uuid-123', name: 'John', surname: 'Doe' }]);

    const result = await service.getUserFullInfo('uuid-123');
    expect(result).toHaveProperty('id_users');
  });

  it('should getBasicInfo', async () => {
    repo.query.mockResolvedValue([{ id_users: 'uuid-123', name: 'John', surname: 'Doe' }]);

    const result = await service.getBasicInfo('uuid-123');
    expect(result).toHaveProperty('id_users');
  });
});

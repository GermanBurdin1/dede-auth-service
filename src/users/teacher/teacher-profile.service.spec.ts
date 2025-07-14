import { Test, TestingModule } from '@nestjs/testing';
import { TeacherProfileService } from './teacher-profile.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TeacherProfile } from './teacher_profiles.entity';
import { User } from '../user.entity';
import { TeacherCertificate } from './teacher_certificates.entity';
import { TeacherSpecialization } from './teacher_specializations.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

describe('TeacherProfileService', () => {
  let service: TeacherProfileService;
  let profileRepo: jest.Mocked<Repository<TeacherProfile>>;
  let userRepo: jest.Mocked<Repository<User>>;
  let certRepo: jest.Mocked<Repository<TeacherCertificate>>;
  let specRepo: jest.Mocked<Repository<TeacherSpecialization>>;

  const mockUser = {
    id_users: 'user-1',
    name: 'John',
    surname: 'Doe',
    roles: ['teacher'],
  } as User;

  const mockProfile = {
    id_teacher_profile: 'profile-1',
    user: mockUser,
    bio: 'Bio',
    price: 50,
    experience_years: 5,
    photo_url: 'url',
    rating: 4.5,
    review_count: 10,
  } as TeacherProfile;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeacherProfileService,
        {
          provide: getRepositoryToken(TeacherProfile),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TeacherCertificate),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TeacherSpecialization),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TeacherProfileService>(TeacherProfileService);
    profileRepo = module.get(getRepositoryToken(TeacherProfile));
    userRepo = module.get(getRepositoryToken(User));
    certRepo = module.get(getRepositoryToken(TeacherCertificate));
    specRepo = module.get(getRepositoryToken(TeacherSpecialization));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // getFullProfileByUserId
  describe('getFullProfileByUserId', () => {
    it('should return full profile with certificates and specializations', async () => {
      profileRepo.findOne.mockResolvedValue(mockProfile);
      certRepo.find.mockResolvedValue([{ certificate_url: 'cert1' } as TeacherCertificate]);
      specRepo.find.mockResolvedValue([{ specialization: 'spec1' } as TeacherSpecialization]);

      const result = await service.getFullProfileByUserId('user-1');

      expect(result.certificates).toEqual(['cert1']);
      expect(result.specializations).toEqual(['spec1']);
    });

    it('should throw if profile not found', async () => {
      profileRepo.findOne.mockResolvedValue(null);

      await expect(service.getFullProfileByUserId('user-1')).rejects.toThrow(NotFoundException);
    });
  });

  // updateProfile
  describe('updateProfile', () => {
    it('should update profile and related data', async () => {
      profileRepo.findOne.mockResolvedValue({ ...mockProfile, user: { ...mockUser } });
      specRepo.delete.mockResolvedValue({} as any);
      (specRepo.save as jest.Mock).mockResolvedValue([
        { specialization: 'spec1' } as TeacherSpecialization,
      ]);      
      certRepo.delete.mockResolvedValue({} as any);
      (certRepo.save as jest.Mock).mockResolvedValue([
        { certificate_url: 'cert1' } as TeacherCertificate,
      ]);
      userRepo.save.mockResolvedValue(mockUser);
      profileRepo.save.mockResolvedValue(mockProfile);

      const updates = {
        bio: 'New Bio',
        price: 100,
        experienceYears: 10,
        specializations: ['Grammar'],
        certificates: ['Cert A'],
        name: 'Jane',
        surname: 'Smith',
      };

      const result = await service.updateProfile('user-1', updates);

      expect(result).toEqual({ message: 'Profile updated' });
    });

    it('should throw if profile not found', async () => {
      profileRepo.findOne.mockResolvedValue(null);

      await expect(service.updateProfile('user-1', {})).rejects.toThrow(NotFoundException);
    });
  });

  // getProfileByUserId
  describe('getProfileByUserId', () => {
    it('should return profile', async () => {
      profileRepo.findOne.mockResolvedValue(mockProfile);

      const result = await service.getProfileByUserId('user-1');

      expect(result).toEqual(mockProfile);
    });

    it('should throw if profile not found', async () => {
      profileRepo.findOne.mockResolvedValue(null);

      await expect(service.getProfileByUserId('user-1')).rejects.toThrow(NotFoundException);
    });
  });

  // createProfileForUser
  describe('createProfileForUser', () => {
    it('should create new profile if not existing', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      profileRepo.findOne.mockResolvedValue(null);
      profileRepo.create.mockReturnValue(mockProfile);
      profileRepo.save.mockResolvedValue(mockProfile);

      const result = await service.createProfileForUser('user-1');

      expect(userRepo.findOne).toHaveBeenCalledWith({ where: { id_users: 'user-1' } });
      expect(profileRepo.create).toHaveBeenCalled();
      expect(profileRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockProfile);
    });

    it('should return existing profile if found', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      profileRepo.findOne.mockResolvedValue(mockProfile);

      const result = await service.createProfileForUser('user-1');

      expect(result).toEqual(mockProfile);
    });

    it('should throw if user not found or not teacher', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.createProfileForUser('user-1')).rejects.toThrow(NotFoundException);

      userRepo.findOne.mockResolvedValue({ ...mockUser, roles: [] });

      await expect(service.createProfileForUser('user-1')).rejects.toThrow(NotFoundException);
    });
  });

  // uploadPhoto
  describe('uploadPhoto', () => {
    it('should update photo url', async () => {
      profileRepo.findOne.mockResolvedValue(mockProfile);
      profileRepo.save.mockResolvedValue({ ...mockProfile, photo_url: 'new-url' });

      const result = await service.uploadPhoto('user-1', 'new-url');

      expect(profileRepo.findOne).toHaveBeenCalledWith({
        where: { user: { id_users: 'user-1' } },
        relations: ['user'],
      });
      expect(result.photo_url).toBe('new-url');
    });

    it('should throw if profile not found', async () => {
      profileRepo.findOne.mockResolvedValue(null);

      await expect(service.uploadPhoto('user-1', 'new-url')).rejects.toThrow(NotFoundException);
    });
  });
});

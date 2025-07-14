import { Test, TestingModule } from '@nestjs/testing';
import { ProfilesService } from './profiles.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

describe('ProfilesService', () => {
  let service: ProfilesService;
  let model: jest.Mocked<Model<any>>;

  beforeEach(async () => {
    const mockModel = {
      findOneAndUpdate: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesService,
        {
          provide: getModelToken('Profile'),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<ProfilesService>(ProfilesService);
    model = module.get(getModelToken('Profile'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createProfile', () => {
    it('should upsert profile successfully', async () => {
      const mockExec = jest.fn().mockResolvedValue({ user_id: '123', full_name: 'John Doe' });
      model.findOneAndUpdate.mockReturnValue({ exec: mockExec } as any);

      const data = {
        user_id: '123',
        full_name: 'John Doe',
        preferences: { language: 'en', theme: 'light' }
      };

      const result = await service.createProfile(data);

      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        { user_id: data.user_id },
        expect.objectContaining({
          $set: expect.objectContaining({
            full_name: 'John Doe',
            preferences: {
              language: 'en',
              theme: 'light'
            }
          }),
        }),
        { upsert: true, new: true }
      );

      expect(result).toEqual({ user_id: '123', full_name: 'John Doe' });
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const mockExec = jest.fn().mockResolvedValue({ user_id: '123', full_name: 'Updated Name' });
      model.findOneAndUpdate.mockReturnValue({ exec: mockExec } as any);

      const updates = { full_name: 'Updated Name' };
      const result = await service.updateProfile('123', updates);

      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        { user_id: '123' },
        updates,
        { new: true }
      );
      expect(result).toEqual({ user_id: '123', full_name: 'Updated Name' });
    });
  });

  describe('findProfile', () => {
    it('should find profile successfully', async () => {
      const mockExec = jest.fn().mockResolvedValue({ user_id: '123', full_name: 'John Doe' });
      model.findOne.mockReturnValue({ exec: mockExec } as any);

      const result = await service.findProfile('123');

      expect(model.findOne).toHaveBeenCalledWith({ user_id: '123' });
      expect(result).toEqual({ user_id: '123', full_name: 'John Doe' });
    });
  });
});

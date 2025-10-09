import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

describe('ProfilesController', () => {
  let controller: ProfilesController;
  let profilesService: jest.Mocked<ProfilesService>;

  beforeEach(() => {
    profilesService = {
      createProfile: jest.fn(),
      findProfile: jest.fn(),
      updateProfile: jest.fn(),
    } as unknown as jest.Mocked<ProfilesService>;

    controller = new ProfilesController(profilesService);
  });

  it('should create a profile', async () => {
    const profileDto = { user_id: 'user1', full_name: 'John Doe' };
    const createdProfile = { ...profileDto, _id: 'profileId' };

    profilesService.createProfile.mockResolvedValue(createdProfile as any);

    const result = await controller.createProfile(profileDto);

    expect(profilesService.createProfile).toHaveBeenCalledWith(profileDto);
    expect(result).toEqual(createdProfile);
  });

  it('should get a profile', async () => {
    const userId = 'user1';
    const profile = { user_id: userId, full_name: 'John Doe' };

    profilesService.findProfile.mockResolvedValue(profile as any);

    const result = await controller.getProfile(userId);

    expect(profilesService.findProfile).toHaveBeenCalledWith(userId);
    expect(result).toEqual(profile);
  });

  it('should update a profile', async () => {
    const userId = 'user1';
    const updates = { bio: 'Updated bio' };
    const updatedProfile = { user_id: userId, bio: 'Updated bio' };
    const mockReq = { user: { sub: userId } }; // Mock request with user

    profilesService.updateProfile.mockResolvedValue(updatedProfile as any);

    const result = await controller.updateProfile(userId, updates, mockReq);

    expect(profilesService.updateProfile).toHaveBeenCalledWith(userId, updates);
    expect(result).toEqual(updatedProfile);
  });
});

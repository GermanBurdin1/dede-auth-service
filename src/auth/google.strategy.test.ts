import { GoogleStrategy } from './google.strategy';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;

  beforeEach(() => {
    strategy = new GoogleStrategy();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should validate and return user data correctly', async () => {
    const profile = {
      id: 'google-id-123',
      displayName: 'John Doe',
      emails: [{ value: 'john@example.com' }],
    };

    const done = jest.fn();

    await strategy.validate('accessToken', 'refreshToken', profile, done);

    expect(done).toHaveBeenCalledWith(null, {
      email: 'john@example.com',
      name: 'John Doe',
      provider: 'google',
      googleId: 'google-id-123',
    });
  });
});

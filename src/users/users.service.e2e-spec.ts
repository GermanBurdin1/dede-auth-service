import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AuthModule } from '../auth.module';
import { MailService } from '../services/mail.service';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';

// ⚡ Вспомогательная функция для создания юзера напрямую
const createTestUser = async (repo: Repository<User>, data: Partial<User>) => {
  const user = repo.create(data);
  return await repo.save(user);
};

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let userRepo: Repository<User>;
  let mailService: MailService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AuthModule,
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User],
          synchronize: true, // Только для тестов
        }),
        TypeOrmModule.forFeature([User]),
      ],
      providers: [MailService],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false }));
    await app.init();

    userRepo = moduleFixture.get(getRepositoryToken(User));
    mailService = moduleFixture.get(MailService);

    // Мок почты, чтобы не слать письма
    jest.spyOn(mailService, 'sendVerificationEmail').mockImplementation(async () => {});
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/register (POST) — регистрирует нового пользователя', async () => {
    const payload = {
      email: 'test@example.com',
      password: 'password123',
      roles: ['student'],
      name: 'John',
      surname: 'Doe',
    };

    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send(payload)
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe(payload.email);
    expect(res.body.roles).toContain('student');
    expect(res.body.isEmailConfirmed).toBe(false);

    const dbUser = await userRepo.findOneBy({ email: payload.email });
    expect(dbUser).toBeDefined();
  });

  it('/auth/login (POST) — успешно логинит', async () => {
    const email = 'login@example.com';
    const plainPassword = 'mypassword';

    // Создаём тестового юзера с хэшированным паролем
    const bcrypt = require('bcrypt');
    const hash = await bcrypt.hash(plainPassword, 10);

    await createTestUser(userRepo, {
      email,
      password: hash,
      roles: ['student'],
      is_active: true,
      is_email_confirmed: true,
    });

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: plainPassword })
      .expect(201);

    expect(res.body.email).toBe(email);
    expect(res.body.roles).toContain('student');
  });

  it('/auth/check-email (GET) — проверяет существование email', async () => {
    const email = 'check@example.com';
    await createTestUser(userRepo, {
      email,
      password: 'fakepass',
      roles: ['student'],
      is_active: true,
      is_email_confirmed: true,
    });

    const res = await request(app.getHttpServer())
      .get('/auth/check-email')
      .query({ email })
      .expect(200);

    expect(res.body.exists).toBe(true);
    expect(res.body.roles).toContain('student');
    expect(res.body.isEmailConfirmed).toBe(true);
  });

  it('/auth/confirm-email (POST) — подтверждает email', async () => {
    const email = 'confirm@example.com';
    await createTestUser(userRepo, {
      email,
      password: 'fakepass',
      roles: ['student'],
      is_active: true,
      is_email_confirmed: false,
    });

    const res = await request(app.getHttpServer())
      .post('/auth/confirm-email')
      .send({ email })
      .expect(201);

    expect(res.body.success).toBe(true);

    const dbUser = await userRepo.findOneBy({ email });
    expect(dbUser.is_email_confirmed).toBe(true);
  });
});

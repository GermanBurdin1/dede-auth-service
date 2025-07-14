import { MailService } from './mail.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('MailService', () => {
  let service: MailService;
  let mockSendMail: jest.Mock;

  beforeEach(() => {
    // Мокаем sendMail
    mockSendMail = jest.fn().mockResolvedValue({});
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
    });

    service = new MailService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send verification email successfully', async () => {
    const to = 'test@example.com';
    const token = 'test-token';

    await service.sendVerificationEmail(to, token);

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: to,
      subject: 'Confirmez votre adresse e-mail sur GalaxyLang',
      html: expect.stringContaining(token), // проверяем что token попал в html
    }));
  });

  it('should handle error when sending fails', async () => {
    mockSendMail.mockRejectedValue(new Error('SMTP error'));

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await service.sendVerificationEmail('fail@example.com', 'fail-token');

    expect(mockSendMail).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[MailService] Ошибка отправки письма:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});

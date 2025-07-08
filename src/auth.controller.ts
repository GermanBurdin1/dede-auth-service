import { BadRequestException, Body, Controller, Get, Logger, Param, Post, Query } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { TeacherProfileService } from './users/teacher/teacher-profile.service';
import { MailService } from './services/mail.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Controller('auth')
export class AuthController {

	private readonly logger = new Logger(AuthController.name);

	constructor(
		private readonly usersService: UsersService,
		private teacherProfileService: TeacherProfileService,
		private readonly mailService: MailService,
		// private readonly jwtService: JwtService,
	) { }

	@Get('users/stats')
	async getUsersStats(
		@Query('startDate') startDate: string,
		@Query('endDate') endDate: string
	) {
		this.logger.log(`Getting user stats from ${startDate} to ${endDate}`);
		
		const stats = await this.usersService.getUserRegistrationStats(
			new Date(startDate),
			new Date(endDate)
		);
		
		return stats;
	}

	@Get('users/:id')
	async getUser(@Param('id') id: string) {
		console.log('⚡ GET /auth/users/:id HIT', id);
		const user = await this.usersService.getBasicInfo(id);
		console.log('🧑 User extracted from DB:', user);
		if (!user) {
			throw new BadRequestException('Utilisateur non trouvé');
		}

		return {
			id: user.id_users,
			name: user.name,
			surname: user.surname,
			isEmailConfirmed: user.is_email_confirmed,
		};
	}

	@Post('register')
	async register(
		@Body() body: {
			email: string;
			password: string;
			roles: string[];
			name: string;
			surname: string;
		}
	) {
		this.logger.log(`Register attempt for: ${body.email}, roles: ${body.roles}`);

		const user = await this.usersService.createOrUpdateUser(
			body.email,
			body.password,
			body.roles,
			body.name,
			body.surname
		);

		this.logger.log(`User created: ${user.email} [${user.roles.join(', ')}]`);

		// Отправляем письмо подтверждения для новых пользователей
		if (!user.is_email_confirmed) {
			try {
				// Создаем простой токен для подтверждения (без сохранения в БД)
				const confirmationToken = crypto.randomBytes(32).toString('hex');
				
				// Отправляем письмо с токеном
				await this.mailService.sendVerificationEmail(user.email, confirmationToken);
				this.logger.log(`Confirmation email sent to ${user.email}`);
			} catch (error) {
				this.logger.error(`Failed to send confirmation email to ${user.email}:`, error);
				// Не прерываем регистрацию из-за ошибки отправки письма
			}
		}

		return {
			id: user.id_users,
			email: user.email,
			roles: user.roles,
			name: user.name,
			surname: user.surname,
			isEmailConfirmed: user.is_email_confirmed
		};
	}

	@Post('login')
	async login(@Body() body: { email: string; password: string }) {
		this.logger.log(`Login attempt for: ${body.email}`);

		const user = await this.usersService.findByEmail(body.email);
		if (!user) {
			this.logger.warn(`Login failed: user not found for ${body.email}`);
			throw new BadRequestException('Utilisateur non trouvé');
		}

		const isMatch = await bcrypt.compare(body.password, user.password);
		this.logger.log("bodypassword:" + body.password, "userpassword:" + user.password);
		if (!isMatch) {
			this.logger.warn(`Login failed: bad password for ${body.email}`);
			throw new BadRequestException('Mot de passe incorrect');
		}

		this.logger.log(`Login successful: ${user.email} [${user.roles.join(', ')}]`);

		return {
			id: user.id_users,
			email: user.email,
			roles: user.roles,
			name: user.name,
			surname: user.surname,
			isEmailConfirmed: user.is_email_confirmed
		};
	}

	@Post('confirm-email')
	async confirmEmail(@Body() body: { email: string; token?: string }) {
		this.logger.log(`Email confirmation attempt for: ${body.email}`);

		try {
			// Простая логика подтверждения без проверки токена
			// В будущем можно добавить более сложную логику с проверкой токена
			const success = await this.usersService.confirmEmail(body.email);
			
			if (success) {
				this.logger.log(`Email confirmed successfully for: ${body.email}`);
				return { 
					success: true, 
					message: 'Email confirmed successfully' 
				};
			} else {
				throw new BadRequestException('Failed to confirm email');
			}
		} catch (error) {
			this.logger.error(`Email confirmation failed for ${body.email}:`, error);
			throw new BadRequestException('Email confirmation failed');
		}
	}

	@Post('resend-confirmation')
	async resendConfirmation(@Body() body: { email: string }) {
		this.logger.log(`Resend confirmation request for: ${body.email}`);

		try {
			const user = await this.usersService.findByEmail(body.email);
			if (!user) {
				throw new BadRequestException('Utilisateur non trouvé');
			}

			if (user.is_email_confirmed) {
				return { 
					success: true, 
					message: 'Email already confirmed' 
				};
			}

			// Создаем новый токен и отправляем письмо
			const confirmationToken = crypto.randomBytes(32).toString('hex');
			await this.mailService.sendVerificationEmail(user.email, confirmationToken);
			
			this.logger.log(`Confirmation email resent to ${user.email}`);
			return { 
				success: true, 
				message: 'Confirmation email sent' 
			};
		} catch (error) {
			this.logger.error(`Failed to resend confirmation email:`, error);
			throw new BadRequestException('Failed to send confirmation email');
		}
	}

	@Get('check-email')
	async checkEmail(@Query('email') email: string) {
		const user = await this.usersService.findByEmail(email);
		if (user) {
			return { 
				exists: true, 
				roles: user.roles,
				isEmailConfirmed: user.is_email_confirmed
			};
		}
		return { exists: false };
	}

	@Get('teachers')
	async getTeachers(
		@Query('page') page = 1,
		@Query('limit') limit = 6,
		@Query('search') search?: string,
		@Query('priceMin') priceMin?: string,
		@Query('priceMax') priceMax?: string,
		@Query('experienceMin') experienceMin?: string,
		@Query('experienceMax') experienceMax?: string,
		@Query('specialization') specialization?: string,
		@Query('language') language?: string
	) {
		const pageNum = parseInt(page as any, 10) || 1;
		const limitNum = parseInt(limit as any, 10) || 6;

		const filters = {
			search,
			priceMin: priceMin ? parseInt(priceMin, 10) : undefined,
			priceMax: priceMax ? parseInt(priceMax, 10) : undefined,
			experienceMin: experienceMin ? parseInt(experienceMin, 10) : undefined,
			experienceMax: experienceMax ? parseInt(experienceMax, 10) : undefined,
			specialization,
			language,
		};

		const [teachers, total] = await this.usersService.findTeachersPaginated(
			pageNum,
			limitNum,
			filters
		);

		const enrichedTeachers = await Promise.all(
			teachers.map(async (t) => {
				try {
					const profile = await this.teacherProfileService.getFullProfileByUserId(t.id_users);
					return {
						id: t.id_users,
						name: `${t.name ?? ''} ${t.surname ?? ''}`.trim() || t.email,
						email: t.email,
						photoUrl: profile.photo_url,
						price: profile.price,
						rating: profile.rating,
						experienceYears: profile.experience_years,
						reviewCount: profile.review_count,
						bio: profile.bio,
						specializations: profile.specializations ?? [],
						certificates: profile.certificates ?? [],
					};
				} catch (err) {
					return null;
				}
			})
		);

		const valid = enrichedTeachers.filter(t => t !== null);

		return { data: valid, total: valid.length };
	}
}
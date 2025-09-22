import { BadRequestException, Body, Controller, Get, Logger, Param, Post, Query, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { TeacherProfileService } from './users/teacher/teacher-profile.service';
import { MailService } from './services/mail.service';
import { JwtAuthService } from './auth/jwt.service';
import { JwtAuthGuard } from './auth/jwt.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';
import { LoginDto } from './auth/dto/login.dto';
import { RegisterDto } from './auth/dto/register.dto';
import { JwtResponseDto } from './auth/dto/jwt-response.dto';
import { RefreshTokenDto } from './auth/dto/refresh-token.dto';
import { ConfirmEmailDto } from './auth/dto/confirm-email.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Controller('auth')
export class AuthController {

	private readonly logger = new Logger(AuthController.name);

	constructor(
		private readonly usersService: UsersService,
		private teacherProfileService: TeacherProfileService,
		private readonly mailService: MailService,
		private readonly jwtAuthService: JwtAuthService,
	) { }

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('admin')
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
	async register(@Body() registerDto: RegisterDto): Promise<JwtResponseDto> {
		this.logger.log(`Register attempt for: ${registerDto.email}, roles: ${registerDto.roles}`);

		const user = await this.usersService.createOrUpdateUser(
			registerDto.email,
			registerDto.password,
			registerDto.roles,
			registerDto.name,
			registerDto.surname
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

		// Генерируем JWT токены
		return await this.jwtAuthService.generateTokens(user);
	}

	@Post('login')
	async login(@Body() loginDto: LoginDto): Promise<JwtResponseDto> {
		this.logger.log(`Login attempt for: ${loginDto.email}`);

		const user = await this.usersService.findByEmail(loginDto.email);
		if (!user) {
			this.logger.warn(`Login failed: user not found for ${loginDto.email}`);
			throw new BadRequestException('Utilisateur non trouvé');
		}

		const isMatch = await bcrypt.compare(loginDto.password, user.password);
		if (!isMatch) {
			this.logger.warn(`Login failed: bad password for ${loginDto.email}`);
			throw new BadRequestException('Mot de passe incorrect');
		}

		this.logger.log(`Login successful: ${user.email} [${user.roles.join(', ')}]`);

		// Генерируем JWT токены
		return await this.jwtAuthService.generateTokens(user);
	}

	@Post('refresh-token')
	async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
		this.logger.log('Token refresh attempt');
		
		try {
			const newTokens = await this.jwtAuthService.refreshAccessToken(refreshTokenDto.refresh_token);
			this.logger.log('Token refreshed successfully');
			return newTokens;
		} catch (error) {
			this.logger.warn('Token refresh failed:', error.message);
			throw new BadRequestException('Invalid refresh token');
		}
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('student', 'teacher', 'admin')
	@Get('profile')
	async getProfile(@Request() req) {
		this.logger.log(`Profile request for user: ${req.user.email}`);
		
		const user = await this.usersService.findByEmail(req.user.email);
		if (!user) {
			throw new BadRequestException('User not found');
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

	@Post('confirm-email')
	async confirmEmail(@Body() confirmEmailDto: ConfirmEmailDto) {
		this.logger.log(`Email confirmation attempt for: ${confirmEmailDto.email}`);

		try {
			// Простая логика подтверждения без проверки токена
			// В будущем можно добавить более сложную логику с проверкой токена
			const success = await this.usersService.confirmEmail(confirmEmailDto.email);
			
			if (success) {
				this.logger.log(`Email confirmed successfully for: ${confirmEmailDto.email}`);
				return { 
					success: true, 
					message: 'Email confirmed successfully' 
				};
			} else {
				throw new BadRequestException('Failed to confirm email');
			}
		} catch (error) {
			this.logger.error(`Email confirmation failed for ${confirmEmailDto.email}:`, error);
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

		const [teachers] = await this.usersService.findTeachersPaginated(
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
				} catch {
					return null;
				}
			})
		);

		const valid = enrichedTeachers.filter(t => t !== null);

		return { data: valid, total: valid.length };
	}

	@Post('users/by-email')
	async getUserByEmail(@Body() body: { email: string }) {
		this.devLog(`📧 [POST] /auth/users/by-email called with email: ${body.email}`);
		
		try {
			const user = await this.usersService.findByEmail(body.email);
			if (!user) {
				this.devLog(`[AUTH CONTROLLER] User not found for email: ${body.email}`);
				return null;
			}

			this.devLog(`[AUTH CONTROLLER] User found:`, user);
			return {
				id: user.id_users,
				name: user.name,
				email: user.email,
				is_email_confirmed: user.is_email_confirmed
			};
		} catch (error) {
			this.devLog(`[AUTH CONTROLLER] Error finding user by email:`, error);
			return null;
		}
	}

	private devLog(message: string, ...args: any[]): void {
		if (process.env.NODE_ENV !== 'production') {
			console.log(message, ...args);
		}
	}
}
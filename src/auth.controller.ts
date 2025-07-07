import { Controller, Post, Body, BadRequestException, Get, Query, Param, UseGuards, Req, Res } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { TeacherProfileService } from './users/teacher/teacher-profile.service';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';


@Controller('auth')
export class AuthController {
	private readonly logger = new Logger(AuthController.name);

	constructor(
		private readonly usersService: UsersService,
		private teacherProfileService: TeacherProfileService,
		private readonly jwtService: JwtService,
	) { }

	/**
	 * Получить статистику регистрации пользователей за период
	 */
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

		return {
			id: user.id_users,
			email: user.email,
			roles: user.roles,
			name: user.name,
			surname: user.surname
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
			currentRole: user.current_role,
			name: user.name,         // ← вот это
			surname: user.surname
		};
	}

	@Get('check-email')
	async checkEmail(@Query('email') email: string) {
		const user = await this.usersService.findByEmail(email);
		if (user) {
			return { exists: true, roles: user.roles };
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
					const profile = await this.teacherProfileService.getFullProfileByUserId(t.id);
					return {
						id: t.id,
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

	@Post('verify-email')
	async verifyEmail(@Body() body: { token: string }) {
		const user = await this.usersService.findByToken(body.token);
		if (!user) {
			throw new BadRequestException('Token invalide ou expiré');
		}
		user.is_email_confirmed = true;
		user.email_confirm_token = null;
		await this.usersService.save(user);
		return { message: 'Email confirmé avec succès' };
	}

	@Get('oauth/google')
	@UseGuards(AuthGuard('google'))
	async googleAuth() {
		// Passport перенаправит на Google
	}

	@Get('oauth/google/callback')
	@UseGuards(AuthGuard('google'))
	async googleAuthCallback(@Req() req, @Res() res) {
		// req.user содержит данные Google
		let user = await this.usersService.findByEmail(req.user.email);
		if (!user) {
			// Создаём пользователя, если не найден
			user = await this.usersService.createOrUpdateUser(
				req.user.email,
				'', // пароль не нужен для OAuth
				['student'], // или определите роль по логике
				req.user.name || '',
				''
			);
		}
		// Генерируем JWT
		const payload = { sub: user.id_users, email: user.email, roles: user.roles };
		const token = this.jwtService.sign(payload);
		// Редиректим на фронт с токеном
		res.redirect(`http://localhost:4200/oauth-success?token=${token}`);
	}

}
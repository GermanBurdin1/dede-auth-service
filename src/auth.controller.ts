import { Controller, Post, Body, BadRequestException, Get, Query, Param } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { TeacherProfileService } from './users/teacher/teacher-profile.service';


@Controller('auth')
export class AuthController {
	private readonly logger = new Logger(AuthController.name);

	constructor(private readonly usersService: UsersService, private teacherProfileService: TeacherProfileService) { }

	@Get('users/:id')
	async getUser(@Param('id') id: string) {
		console.log('⚡ GET /auth/users/:id HIT', id);
		const user = await this.usersService.getBasicInfo(id);
		console.log('🧑 User fetched from DB:', user);
		if (!user) {
			throw new BadRequestException('Utilisateur non trouvé');
		}

		console.log("sdflksdflsdkfslf")

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



}
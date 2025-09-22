import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import { Logger } from '@nestjs/common';

@Injectable()
export class UsersService {
	private readonly logger = new Logger(UsersService.name);

	constructor(
		@InjectRepository(User)
		private userRepo: Repository<User>,
	) { }

	async createOrUpdateUser(
		email: string,
		password: string,
		roles: string[],
		name: string,
		surname: string
	): Promise<User> {
		const existing = await this.userRepo.findOne({ where: { email } });

		if (existing) {
			const existingRoles = existing.roles || [];
			const newRoles = roles.filter(role => !existingRoles.includes(role));

			if (newRoles.length === 0) {
				throw new BadRequestException('Вы уже зарегистрированы с этой ролью');
			}

			if (existingRoles.length + newRoles.length > 2) {
				throw new BadRequestException('Нельзя добавить более двух ролей для одного пользователя');
			}

			existing.roles = [...existingRoles, ...newRoles];
			existing.name = name;
			existing.surname = surname;

			return this.userRepo.save(existing);
		}

		// Новый пользователь
		const hash = await bcrypt.hash(password, 10);

		const user = this.userRepo.create({
			email,
			password: hash,
			roles,
			name,
			surname,
			is_active: true,
			is_email_confirmed: false, // Новые пользователи должны подтвердить email
		});

		await this.userRepo.save(user);

		return user;
	}


	async save(user: User): Promise<User> {
		return this.userRepo.save(user);
	}

	// Новые методы для email confirmation
	async confirmEmail(email: string): Promise<boolean> {
		try {
			const user = await this.findByEmail(email);
			if (!user) {
				this.logger.warn(`Cannot confirm email: user not found for ${email}`);
				return false;
			}

			if (user.is_email_confirmed) {
				this.logger.log(`Email already confirmed for ${email}`);
				return true;
			}

			user.is_email_confirmed = true;
			await this.save(user);
			
			this.logger.log(`Email confirmed successfully for ${email}`);
			return true;
		} catch (error) {
			this.logger.error(`Error confirming email for ${email}:`, error);
			return false;
		}
	}

	async isEmailConfirmed(email: string): Promise<boolean> {
		try {
			const user = await this.findByEmail(email);
			return user ? user.is_email_confirmed : false;
		} catch (error) {
			this.logger.error(`Error checking email confirmation status for ${email}:`, error);
			return false;
		}
	}

	async sendConfirmationEmail(email: string): Promise<boolean> {
		// Логика отправки подтверждающего письма
		// Будет вызываться из auth controller с MailService
		const user = await this.findByEmail(email);
		if (!user) {
			return false;
		}

		if (user.is_email_confirmed) {
			this.logger.log(`Email already confirmed for ${email}, skipping send`);
			return true;
		}

		// Возвращаем true, фактическая отправка будет в auth controller
		return true;
	}

	async findTeachersPaginated(
		page: number,
		limit: number,
		filters?: any
	): Promise<[User[], number]> {
		// Логируем фильтры для отладки (если переданы)
		if (filters) {
			this.logger.log(`🔍 Фильтры поиска учителей: ${JSON.stringify(filters)}`);
		}
		
		return this.userRepo
			.createQueryBuilder('user')
			.where(`'teacher' = ANY(user.roles)`)
			.skip((page - 1) * limit)
			.take(limit)
			.getManyAndCount();
	}

	/**
	 * Возвращает детальную информацию о пользователе для заголовка
	 */
	async getUserFullInfo(userId: string): Promise<any | null> {
		console.log('📘 [DB] getUserFullInfo called with id:', userId);

		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
		if (!uuidRegex.test(userId)) {
			console.error('❌ [DB] Invalid UUID format:', userId);
			return null;
		}

		try {
			const result = await this.userRepo.query(
				`SELECT 
					u.id_users, 
					u.name, 
					u.surname,
					u.roles,
					u.is_email_confirmed,
					tp.photo_url,
					tp.bio,
					tp.experience_years,
					tp.rating
				FROM users u
				LEFT JOIN teacher_profiles tp ON tp.user_id = u.id_users
				WHERE u.id_users = $1`,
				[userId]
			);

			const user = result[0];

			if (!user) {
				console.warn('⚠️ [DB] No user found with id:', userId);
				return null;
			}

			console.log('✅ [DB] User found with full info:', user);
			return user;
		} catch (error) {
			console.error('❌ [DB] Error fetching user full info:', error);
			return null;
		}
	}

	async getBasicInfo(userId: string): Promise<any | null> {
		console.log('📘 [DB] getBasicInfo called with id:', userId);

		// Валидация UUID
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
		if (!uuidRegex.test(userId)) {
			console.error('❌ [DB] Invalid UUID format:', userId);
			return null;
		}

		try {
			const result = await this.userRepo.query(
				`SELECT 
					u.id_users, 
					u.name, 
					u.surname,
					u.roles,
					u.is_email_confirmed,
					g."examLevel",
					g."targetDate",
					g.description AS goal_description
				FROM users u
				LEFT JOIN student_goals g ON g."studentId" = u.id_users AND g."isActive" = true
				WHERE u.id_users = $1`,
				[userId]
			);

			const user = result[0];

			if (!user) {
				console.warn('⚠️ [DB] No user found with id:', userId);
				return null;
			}

			console.log('✅ [DB] User found with goal info:', user);
			return user;
		} catch (error) {
			console.error('❌ [DB] Error fetching user info (raw SQL):', error);
			return null;
		}
	}

	/**
	 * Получить статистику регистрации пользователей за заданный период
	 */
	async getUserRegistrationStats(startDate: Date, endDate: Date) {
		try {
			this.logger.log(`📊 Getting user registration stats from ${startDate.toISOString()} to ${endDate.toISOString()}`);

			// Используем только raw SQL для работы с PostgreSQL массивами
			const result = await this.userRepo.query(`
				SELECT 
					COUNT(*) FILTER (WHERE 'student' = ANY(roles)) as student_count,
					COUNT(*) FILTER (WHERE 'teacher' = ANY(roles)) as teacher_count,
					COUNT(*) FILTER (WHERE is_email_confirmed = true) as confirmed_emails_count
				FROM users 
				WHERE created_at BETWEEN $1 AND $2
			`, [startDate, endDate]);

			const stats = result[0];
			const newStudents = parseInt(stats.student_count) || 0;
			const newTeachers = parseInt(stats.teacher_count) || 0;
			const confirmedEmails = parseInt(stats.confirmed_emails_count) || 0;
			
			this.logger.log(`📊 Stats: ${newStudents} students, ${newTeachers} teachers, ${confirmedEmails} confirmed emails`);

			return {
				newStudents,
				newTeachers,
				confirmedEmails,
				period: {
					startDate: startDate.toISOString(),
					endDate: endDate.toISOString()
				}
			};
		} catch (error) {
			this.logger.error('❌ Error getting user registration stats:', error);
			return { 
				newStudents: 0, 
				newTeachers: 0,
				confirmedEmails: 0,
				period: {
					startDate: startDate.toISOString(),
					endDate: endDate.toISOString()
				}
			};
		}
	}

	async findByEmail(email: string): Promise<User | null> {
		try {
			this.devLog(`[USERS SERVICE] Searching for user with email: ${email}`);
			const user = await this.userRepo.findOne({ where: { email } });
			this.devLog(`[USERS SERVICE] User found:`, user ? 'Yes' : 'No');
			return user;
		} catch (error) {
			this.devLog(`[USERS SERVICE] Error finding user by email:`, error);
			return null;
		}
	}

	private devLog(message: string, ...args: any[]): void {
		if (process.env.NODE_ENV !== 'production') {
			console.log(message, ...args);
		}
	}
}

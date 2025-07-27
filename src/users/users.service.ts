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
				throw new BadRequestException('Vous êtes déjà inscrit avec ce rôle');
			}

			if (existingRoles.length + newRoles.length > 2) {
				throw new BadRequestException('Impossible d\'ajouter plus de deux rôles pour un utilisateur');
			}

			existing.roles = [...existingRoles, ...newRoles];
			existing.name = name;
			existing.surname = surname;

			return this.userRepo.save(existing);
		}

		// création d'un nouvel utilisateur
		const hash = await bcrypt.hash(password, 10);

		const user = this.userRepo.create({
			email,
			password: hash,
			roles,
			name,
			surname,
			is_active: true,
			is_email_confirmed: false, // les nouveaux utilisateurs doivent confirmer leur email
		});

		await this.userRepo.save(user);

		return user;
	}

	async findByEmail(email: string): Promise<User | null> {
		this.logger.log(`Looking for user with email: ${email}`);
		return this.userRepo.findOne({ where: { email } });
	}

	async save(user: User): Promise<User> {
		return this.userRepo.save(user);
	}

	// méthodes pour la confirmation d'email
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
		// logique d'envoi d'email de confirmation
		// sera appelée depuis auth controller avec MailService
		const user = await this.findByEmail(email);
		if (!user) {
			return false;
		}

		if (user.is_email_confirmed) {
			this.logger.log(`Email already confirmed for ${email}, skipping send`);
			return true;
		}

		// on retourne true, l'envoi réel sera fait dans auth controller
		return true;
	}

	async findTeachersPaginated(
		page: number,
		limit: number,
		filters?: any
	): Promise<[User[], number]> {
		// TODO : implémenter les filtres de recherche
		return this.userRepo
			.createQueryBuilder('user')
			.where(`'teacher' = ANY(user.roles)`)
			.skip((page - 1) * limit)
			.take(limit)
			.getManyAndCount();
	}

	/**
	 * Récupère les informations détaillées d'un utilisateur pour l'en-tête
	 */
	async getUserFullInfo(userId: string): Promise<any | null> {
		console.log('[DB] getUserFullInfo appelé avec id:', userId);

		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
		if (!uuidRegex.test(userId)) {
			console.error('[DB] Format UUID invalide:', userId);
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
				console.warn('[DB] Aucun utilisateur trouvé avec id:', userId);
				return null;
			}

			console.log('[DB] Utilisateur trouvé avec infos complètes:', user);
			return user;
		} catch (error) {
			console.error('[DB] Erreur lors de la récupération des infos utilisateur:', error);
			return null;
		}
	}

	async getBasicInfo(userId: string): Promise<any | null> {
		console.log('[DB] getBasicInfo appelé avec id:', userId);

		// validation UUID
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
		if (!uuidRegex.test(userId)) {
			console.error('[DB] Format UUID invalide:', userId);
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
				console.warn('[DB] Aucun utilisateur trouvé avec id:', userId);
				return null;
			}

			console.log('[DB] Utilisateur trouvé avec infos objectif:', user);
			return user;
		} catch (error) {
			console.error('[DB] Erreur lors de la récupération des infos utilisateur (SQL brut):', error);
			return null;
		}
	}

	/**
	 * Récupère les statistiques d'inscription des utilisateurs sur une période donnée
	 */
	async getUserRegistrationStats(startDate: Date, endDate: Date) {
		try {
			this.logger.log(`Récupération des stats d'inscription du ${startDate.toISOString()} au ${endDate.toISOString()}`);

			// on utilise uniquement du SQL brut pour travailler avec les tableaux PostgreSQL
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
			
			this.logger.log(`Stats: ${newStudents} étudiants, ${newTeachers} enseignants, ${confirmedEmails} emails confirmés`);

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
			this.logger.error('Erreur lors de la récupération des stats d\'inscription:', error);
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
}

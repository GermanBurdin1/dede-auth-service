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

	async createOrUpdateUser(email: string, password: string, roles: string[]): Promise<User> {
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
			return this.userRepo.save(existing);
		}

		// Новый пользователь
		const hash = await bcrypt.hash(password, 10);
		const user = this.userRepo.create({
			email,
			password: hash,
			roles,
			is_active: true,
		});

		return this.userRepo.save(user);
	}


	async findByEmail(email: string): Promise<User | null> {
		this.logger.log(`Looking for user with email: ${email}`);
		return this.userRepo.findOne({ where: { email } });
	}

	async findTeachersPaginated(
  page: number,
  limit: number,
  filters: {
    priceMin?: number;
    priceMax?: number;
    experienceMin?: number;
    experienceMax?: number;
    specialization?: string;
    language?: string;
    search?: string;
  }
): Promise<[any[], number]> {
  const qb = this.userRepo
    .createQueryBuilder('user')
    .innerJoin('teacher_profiles', 'profile', 'profile.user_id = user.id_users')
    .leftJoin('teacher_specializations', 'spec', 'spec.teacher_profile_id = profile.id_teacher_profile')
    .where(`'teacher' = ANY(user.roles)`);

  // 🔍 Apply filters
  if (filters.search) {
    qb.andWhere('LOWER(user.email) LIKE :search', {
      search: `%${filters.search.toLowerCase()}%`
    });
  }
  if (filters.experienceMin !== undefined) {
    qb.andWhere('profile.experience_years >= :minExp', { minExp: filters.experienceMin });
  }
  if (filters.experienceMax !== undefined) {
    qb.andWhere('profile.experience_years <= :maxExp', { maxExp: filters.experienceMax });
  }
  if (filters.priceMin !== undefined) {
    qb.andWhere('profile.price >= :minPrice', { minPrice: filters.priceMin });
  }
  if (filters.priceMax !== undefined) {
    qb.andWhere('profile.price <= :maxPrice', { maxPrice: filters.priceMax });
  }
  if (filters.specialization) {
    qb.andWhere('spec.specialization = :spec', { spec: filters.specialization });
  }
  if (filters.language) {
    qb.andWhere(`:lang = ANY(user.teachingLanguages)`, { lang: filters.language });
  }

  // 📌 Find matching teacher IDs
  const subquery = qb
    .clone()
    .select('DISTINCT user.id_users')
    .getRawMany();

  const ids = (await subquery).map(row => row.id_users);
  if (ids.length === 0) return [[], 0];

  // ✅ Fetch full teacher info via native SQL (guaranteed field names)
  const data = await this.userRepo.query(`
  SELECT 
    u.id_users AS id,
    u.email AS email,
    u.roles AS roles,
    u.current_role AS "currentRole",
    p.photo_url AS "photoUrl",
    p.price AS price,
    p.experience_years AS "experienceYears",
    p.rating AS rating,
    p.review_count AS "reviewCount"
  FROM users AS u
  INNER JOIN teacher_profiles AS p ON p.user_id = u.id_users
  WHERE u.id_users = ANY($1)
  ORDER BY u.created_at DESC
  LIMIT $2 OFFSET $3
`, [ids, limit, (page - 1) * limit]);


  const total = ids.length;

  this.logger.debug('📦 Отдаю данные преподавателей:', data);
  return [data, total];
}

}
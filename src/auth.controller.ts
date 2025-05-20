import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';


@Controller('auth')
export class AuthController {
	private readonly logger = new Logger(AuthController.name);

	constructor(private readonly usersService: UsersService) { }

	@Post('register')
	async register(@Body() body: { email: string; password: string; roles: string[] }) {
		this.logger.log(`Register attempt for: ${body.email}, roles: ${body.roles}`);

		const existing = await this.usersService.findByEmail(body.email);
		if (existing) {
			this.logger.warn(`Registration failed: email ${body.email} already exists`);
			throw new BadRequestException('Email déjà utilisé');
		}

		const user = await this.usersService.createUser(body.email, body.password, body.roles);

		this.logger.log(`User created: ${user.email} [${user.roles.join(', ')}]`);

		return {
			id: user.id_users, // ← если фронт ожидает `id`, а не `id_users`
			email: user.email,
			roles: user.roles
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
		if (!isMatch) {
			this.logger.warn(`Login failed: bad password for ${body.email}`);
			throw new BadRequestException('Mot de passe incorrect');
		}

		this.logger.log(`Login successful: ${user.email} [${user.roles.join(', ')}]`);

		return {
			id: user.id_users,
			email: user.email,
			roles: user.roles
		};
	}

}
import { Controller, Post, Body, BadRequestException, Get, Query } from '@nestjs/common';
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

		const user = await this.usersService.createOrUpdateUser(body.email, body.password, body.roles);

		this.logger.log(`User created or updated: ${user.email} [${user.roles.join(', ')}]`);

		return {
			id: user.id_users,
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
			roles: user.roles,
			currentRole: user.current_role
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


}
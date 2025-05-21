import { Controller, Get, Put, Param, Body, Post } from '@nestjs/common';
import { ProfilesService } from './profiles.service';

@Controller('profiles')
export class ProfilesController {
	constructor(private readonly profilesService: ProfilesService) { }

	@Post()
	async createProfile(@Body() profile: any) {
		console.log('[ProfilesController] Creating profile for user_id:', profile.user_id);
		return this.profilesService.createProfile(profile);
	}

	@Get(':user_id')
	async getProfile(@Param('user_id') user_id: string) {
		return this.profilesService.findProfile(user_id);
	}

	@Put(':user_id')
	async updateProfile(@Param('user_id') user_id: string, @Body() updates: any) {
		console.log('[ProfilesController] PUT /profiles/' + user_id);
		console.log('[ProfilesController] Updates payload:', updates);

		return this.profilesService.updateProfile(user_id, updates);
	}

}

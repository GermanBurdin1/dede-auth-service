import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { TeacherProfileService } from './teacher-profile.service';

@Controller('teacher-profile')
export class TeacherProfileController {
	constructor(private readonly profileService: TeacherProfileService) { }

	@Post('create/:userId')
	async create(@Param('userId') userId: string) {
		return this.profileService.createProfileForUser(userId);
	}

	@Get(':userId')
	async getByUserId(@Param('userId') userId: string) {
		return this.profileService.getProfileByUserId(userId);
	}

	@Get('full/:userId')
	getFull(@Param('userId') userId: string) {
		return this.profileService.getFullProfileByUserId(userId);
	}

	@Put('update/:userId')
	update(
		@Param('userId') userId: string,
		@Body() data: {
			bio?: string;
			price?: number;
			experienceYears?: number;
			specializations?: string[];
			certificates?: string[];
		}
	) {
		return this.profileService.updateProfile(userId, data);
	}

	@Put('photo/:userId')
	updatePhoto(
		@Param('userId') userId: string,
		@Body('photoUrl') photoUrl: string
	) {
		return this.profileService.uploadPhoto(userId, photoUrl);
	}

}

import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { TeacherProfileService } from './teacher-profile.service';
import { Public } from '../../auth/public.decorator';

@Controller('teacher-profile')
export class TeacherProfileController {
	constructor(private readonly profileService: TeacherProfileService) { }

	@Public()
	@Post('create/:userId')
	async create(@Param('userId') userId: string) {
		return this.profileService.createProfileForUser(userId);
	}

	@Public()
	@Get(':userId')
	async getByUserId(@Param('userId') userId: string) {
		return this.profileService.getProfileByUserId(userId);
	}

	@Public()
	@Get('full/:userId')
	getFull(@Param('userId') userId: string) {
		return this.profileService.getFullProfileByUserId(userId);
	}

	@Public()
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

	@Public()
	@Put('photo/:userId')
	updatePhoto(
		@Param('userId') userId: string,
		@Body('photoUrl') photoUrl: string
	) {
		return this.profileService.uploadPhoto(userId, photoUrl);
	}

}

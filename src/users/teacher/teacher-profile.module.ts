import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherProfile } from './teacher_profiles.entity';
import { TeacherCertificate } from './teacher_certificates.entity';
import { TeacherSpecialization } from './teacher_specializations.entity';
import { TeacherProfileService } from './teacher-profile.service';
import { TeacherProfileController } from './teacher-profile.controller';
import { User } from '../user.entity';

@Module({
	imports: [TypeOrmModule.forFeature([TeacherProfile, TeacherCertificate,
		TeacherSpecialization, User])],
	providers: [TeacherProfileService],
	controllers: [TeacherProfileController]
})
export class TeacherProfileModule { }

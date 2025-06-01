import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { User } from './users/user.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth.module';
import { TeacherProfileModule } from './users/teacher/teacher-profile.module';
import { TeacherProfile } from './users/teacher/teacher_profiles.entity';
import { TeacherCertificate } from './users/teacher/teacher_certificates.entity';
import { TeacherSpecialization } from './users/teacher/teacher_specializations.entity';


@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),

		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (config: ConfigService) => ({
				type: 'postgres',
				host: config.get<string>('DB_HOST'),
				port: +config.get<number>('DB_PORT')!,
				username: config.get<string>('DB_USERNAME'),
				password: config.get<string>('DB_PASSWORD'),
				database: config.get<string>('DB_NAME'),
				entities: [User,
					TeacherProfile,
					TeacherCertificate,
					TeacherSpecialization],
				migrations: ['dist/migrations/*.js'],
				synchronize: false,
			}),
		}),

		// MongoDB (Mongoose)
		MongooseModule.forRoot(process.env.MONGO_URI),

		UsersModule,
		ProfilesModule,
		AuthModule,
		TeacherProfileModule
	],
})
export class AppModule { }

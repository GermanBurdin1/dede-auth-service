import { DataSource } from 'typeorm';
import { User } from './users/user.entity'; 
import { TeacherProfile } from './users/teacher/teacher_profiles.entity';
import { TeacherSpecialization } from './users/teacher/teacher_specializations.entity';
import { TeacherCertificate } from './users/teacher/teacher_certificates.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgre',
  database: 'postgres',
  synchronize: false,
  logging: true,
  entities: [User, TeacherProfile,
  TeacherSpecialization,
  TeacherCertificate],
  migrations: ['src/migrations/*.ts'],
  subscribers: [],
});

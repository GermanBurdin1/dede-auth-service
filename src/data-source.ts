import { DataSource } from 'typeorm';
import { User } from './users/user.entity'; 
import { TeacherProfile } from './users/teacher/teacher_profiles.entity';
import { TeacherSpecialization } from './users/teacher/teacher_specializations.entity';
import { TeacherCertificate } from './users/teacher/teacher_certificates.entity';
import { StudentGoal } from './goals/student-goal.entity';
import * as dotenv from 'dotenv';

dotenv.config(); // charge les variables d'environnement

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false, // TODO : vérifier que c'est bien à false en prod
  logging: true,
  entities: [User, TeacherProfile, TeacherSpecialization, TeacherCertificate, StudentGoal],
  migrations: ['src/migrations/*.ts'],
  subscribers: [],
});
import { DataSource } from 'typeorm';
import { User } from './users/user.entity'; // путь к твоей сущности

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgre',
  database: 'postgres',
  synchronize: false,
  logging: true,
  entities: [User],
  migrations: ['src/migrations/*.ts'],
  subscribers: [],
});

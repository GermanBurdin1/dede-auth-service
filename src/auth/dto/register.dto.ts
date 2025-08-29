import { IsEmail, IsNotEmpty, IsString, MinLength, IsArray, ArrayNotEmpty } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email должен быть валидным' })
  @IsNotEmpty({ message: 'Email обязателен' })
  email: string;

  @IsString({ message: 'Пароль должен быть строкой' })
  @IsNotEmpty({ message: 'Пароль обязателен' })
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
  password: string;

  @IsArray({ message: 'Роли должны быть массивом' })
  @ArrayNotEmpty({ message: 'Необходимо указать хотя бы одну роль' })
  @IsString({ each: true, message: 'Каждая роль должна быть строкой' })
  roles: string[];

  @IsString({ message: 'Имя должно быть строкой' })
  @IsNotEmpty({ message: 'Имя обязательно' })
  name: string;

  @IsString({ message: 'Фамилия должна быть строкой' })
  @IsNotEmpty({ message: 'Фамилия обязательна' })
  surname: string;
}

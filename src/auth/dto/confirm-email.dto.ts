import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ConfirmEmailDto {
  @IsEmail({}, { message: 'Email должен быть валидным' })
  @IsNotEmpty({ message: 'Email обязателен' })
  email: string;

  @IsOptional()
  @IsString({ message: 'Token должен быть строкой' })
  token?: string;
}

export class JwtResponseDto {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    roles: string[];
    name: string;
    surname: string;
    isEmailConfirmed: boolean;
  };
  expires_in: number; // время жизни access токена в секундах
}

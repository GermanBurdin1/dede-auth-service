import { Controller, Get, Param, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { Public } from '../auth/public.decorator';

@Controller('email')
export class EmailController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Get('user/:id')
  async getUserEmail(@Param('id') id: string) {
    console.log('📧 GET /email/user/:id HIT', id);
    
    try {
      const user = await this.usersService.getBasicInfo(id);
      console.log('📧 User extracted from DB:', user);
      
      if (!user) {
        throw new BadRequestException('Utilisateur non trouvé');
      }

      return {
        id: user.id_users,
        email: user.email,
        name: user.name,
        surname: user.surname,
      };
    } catch (error) {
      console.error('📧 Error getting user email:', error);
      throw new BadRequestException('Erreur lors de la récupération de l\'email');
    }
  }
}

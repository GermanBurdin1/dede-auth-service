import { Controller, Get, Post, Put, Delete, Body, Param, Req } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';

@Controller('goals')
export class GoalsController {
  constructor(private goalsService: GoalsService) {}

  @Get('exam-levels')
  getAvailableExamLevels() {
    return {
      levels: this.goalsService.getAvailableExamLevels()
    };
  }

  @Post()
  async createGoal(@Body() createGoalDto: CreateGoalDto, @Req() req: any) {
    const studentId = req.user?.id || req.body.studentId; // récupéré depuis le token ou le body de la requête
    return this.goalsService.createGoal(studentId, createGoalDto);
  }

  @Get('student/:studentId/active')
  async getActiveGoal(@Param('studentId') studentId: string) {
    return this.goalsService.getActiveGoal(studentId);
  }

  @Get('student/:studentId')
  async getAllGoals(@Param('studentId') studentId: string) {
    // TODO : ajouter du cache pour éviter les requêtes répétées
    return this.goalsService.getAllGoals(studentId);
  }

  @Put(':goalId')
  async updateGoal(@Param('goalId') goalId: string, @Body() updateData: Partial<CreateGoalDto>) {
    return this.goalsService.updateGoal(goalId, updateData);
  }

  @Delete(':goalId')
  async deleteGoal(@Param('goalId') goalId: string) {
    await this.goalsService.deleteGoal(goalId);
    return { message: 'Goal deleted successfully' };
  }
} 
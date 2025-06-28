import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentGoal, ExamLevel } from './student-goal.entity';
import { CreateGoalDto } from './dto/create-goal.dto';

@Injectable()
export class GoalsService {
  constructor(
    @InjectRepository(StudentGoal)
    private goalRepository: Repository<StudentGoal>,
  ) {}

  async createGoal(studentId: string, createGoalDto: CreateGoalDto): Promise<StudentGoal> {
    // Деактивируем предыдущие цели
    await this.goalRepository.update(
      { studentId, isActive: true },
      { isActive: false }
    );

    // Создаем новую цель
    const goal = this.goalRepository.create({
      studentId,
      examLevel: createGoalDto.examLevel,
      targetDate: createGoalDto.targetDate ? new Date(createGoalDto.targetDate) : undefined,
      description: createGoalDto.description,
      isActive: true
    });

    return this.goalRepository.save(goal);
  }

  async getActiveGoal(studentId: string): Promise<StudentGoal | null> {
    return this.goalRepository.findOne({
      where: { studentId, isActive: true }
    });
  }

  async getAllGoals(studentId: string): Promise<StudentGoal[]> {
    return this.goalRepository.find({
      where: { studentId },
      order: { createdAt: 'DESC' }
    });
  }

  async updateGoal(goalId: string, updateData: Partial<CreateGoalDto>): Promise<StudentGoal> {
    const goal = await this.goalRepository.findOne({ where: { id: goalId } });
    if (!goal) {
      throw new Error('Goal not found');
    }

    if (updateData.examLevel) goal.examLevel = updateData.examLevel;
    if (updateData.targetDate) goal.targetDate = new Date(updateData.targetDate);
    if (updateData.description !== undefined) goal.description = updateData.description;

    return this.goalRepository.save(goal);
  }

  async deleteGoal(goalId: string): Promise<void> {
    await this.goalRepository.update(goalId, { isActive: false });
  }

  // Метод для получения доступных уровней экзаменов
  getAvailableExamLevels(): ExamLevel[] {
    return Object.values(ExamLevel);
  }
} 
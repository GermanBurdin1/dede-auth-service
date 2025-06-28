import { ExamLevel } from '../student-goal.entity';

export class CreateGoalDto {
  examLevel: ExamLevel;
  targetDate?: string;
  description?: string;

  constructor(examLevel: ExamLevel, targetDate?: string, description?: string) {
    this.examLevel = examLevel;
    this.targetDate = targetDate;
    this.description = description;
  }
} 
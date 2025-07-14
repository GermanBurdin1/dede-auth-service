import { Test, TestingModule } from '@nestjs/testing';
import { GoalsService } from './goals.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StudentGoal, ExamLevel } from './student-goal.entity';
import { Repository } from 'typeorm';
import { CreateGoalDto } from './dto/create-goal.dto';

describe('GoalsService', () => {
  let service: GoalsService;
  let repo: jest.Mocked<Repository<StudentGoal>>;

  const mockGoal: StudentGoal = {
    id: 'goal-uuid',
    studentId: 'student-uuid',
    examLevel: ExamLevel.B2,
    targetDate: new Date('2025-12-31'),
    description: 'Test goal',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    student: {} as any,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalsService,
        {
          provide: getRepositoryToken(StudentGoal),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GoalsService>(GoalsService);
    repo = module.get(getRepositoryToken(StudentGoal));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createGoal', () => {
    it('should deactivate old goals and create new one', async () => {
      const dto: CreateGoalDto = {
        examLevel: ExamLevel.B2,
        targetDate: new Date('2025-12-31').toISOString(),
        description: 'New goal',
      };

      const newGoal = { ...mockGoal, ...dto };
      repo.create.mockReturnValue(newGoal as any);
      repo.save.mockResolvedValue(newGoal as any);

      const result = await service.createGoal('student-uuid', dto);

      expect(repo.update).toHaveBeenCalledWith(
        { studentId: 'student-uuid', isActive: true },
        { isActive: false },
      );
      expect(repo.create).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalledWith(newGoal);
      expect(result).toEqual(newGoal);
    });
  });

  describe('getActiveGoal', () => {
    it('should return active goal', async () => {
      repo.findOne.mockResolvedValue(mockGoal);
      const result = await service.getActiveGoal('student-uuid');
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { studentId: 'student-uuid', isActive: true },
      });
      expect(result).toEqual(mockGoal);
    });
  });

  describe('getAllGoals', () => {
    it('should return all goals for student', async () => {
      repo.find.mockResolvedValue([mockGoal]);
      const result = await service.getAllGoals('student-uuid');
      expect(repo.find).toHaveBeenCalledWith({
        where: { studentId: 'student-uuid' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([mockGoal]);
    });
  });

  describe('updateGoal', () => {
    it('should update goal data', async () => {
      repo.findOne.mockResolvedValue(mockGoal);
      repo.save.mockResolvedValue({ ...mockGoal, description: 'Updated' });

      const result = await service.updateGoal('goal-uuid', {
        description: 'Updated',
      });

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'goal-uuid' } });
      expect(repo.save).toHaveBeenCalled();
      expect(result.description).toBe('Updated');
    });

    it('should throw error if goal not found', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.updateGoal('invalid-id', {})).rejects.toThrow('Goal not found');
    });
  });

  describe('deleteGoal', () => {
    it('should deactivate goal', async () => {
      repo.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });
      await service.deleteGoal('goal-uuid');
      expect(repo.update).toHaveBeenCalledWith('goal-uuid', { isActive: false });
    });
  });

  describe('getAvailableExamLevels', () => {
    it('should return all exam levels', () => {
      const levels = service.getAvailableExamLevels();
      expect(levels).toEqual(Object.values(ExamLevel));
    });
  });
});

import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { ExamLevel } from './student-goal.entity';

describe('GoalsController', () => {
  let goalsService: jest.Mocked<GoalsService>;
  let controller: GoalsController;

  beforeEach(() => {
    goalsService = {
      createGoal: jest.fn(),
      getAllGoals: jest.fn(),
      getActiveGoal: jest.fn(),
      updateGoal: jest.fn(),
      deleteGoal: jest.fn(),
      getAvailableExamLevels: jest.fn(),
    } as unknown as jest.Mocked<GoalsService>;

    controller = new GoalsController(goalsService);
  });

  it('should create a goal', async () => {
    const dto = new CreateGoalDto(ExamLevel.B2, '2024-12-31', 'desc');
    const req = { user: { id: 'student1' }, body: {} };
    const result = { id: 'goal1', studentId: 'student1', examLevel: ExamLevel.B2, description: 'desc' };

    goalsService.createGoal.mockResolvedValue(result as any);

    const res = await controller.createGoal(dto, req);
    expect(goalsService.createGoal).toHaveBeenCalledWith('student1', dto);
    expect(res).toEqual(result);
  });

  it('should get all goals', async () => {
    const studentId = 'student1';
    const goals = [{ id: 'goal1' }, { id: 'goal2' }];
    goalsService.getAllGoals.mockResolvedValue(goals as any);

    const res = await controller.getAllGoals(studentId);
    expect(goalsService.getAllGoals).toHaveBeenCalledWith(studentId);
    expect(res).toEqual(goals);
  });

  it('should get active goal', async () => {
    const studentId = 'student1';
    const goal = { id: 'goal1' };
    goalsService.getActiveGoal.mockResolvedValue(goal as any);

    const res = await controller.getActiveGoal(studentId);
    expect(goalsService.getActiveGoal).toHaveBeenCalledWith(studentId);
    expect(res).toEqual(goal);
  });

  it('should update goal', async () => {
    const goalId = 'goal1';
    const updateData = { description: 'Updated desc' };
    const updated = { id: goalId, description: 'Updated desc' };
    goalsService.updateGoal.mockResolvedValue(updated as any);

    const res = await controller.updateGoal(goalId, updateData);
    expect(goalsService.updateGoal).toHaveBeenCalledWith(goalId, updateData);
    expect(res).toEqual(updated);
  });

  it('should delete goal', async () => {
    const goalId = 'goal1';
    goalsService.deleteGoal.mockResolvedValue(undefined);

    const res = await controller.deleteGoal(goalId);
    expect(goalsService.deleteGoal).toHaveBeenCalledWith(goalId);
    expect(res).toEqual({ message: 'Goal deleted successfully' });
  });

  it('should get available exam levels', () => {
    const levels = [ExamLevel.A1, ExamLevel.B2];
    goalsService.getAvailableExamLevels.mockReturnValue(levels);

    const res = controller.getAvailableExamLevels();
    expect(goalsService.getAvailableExamLevels).toHaveBeenCalled();
    expect(res).toEqual({ levels });
  });
});

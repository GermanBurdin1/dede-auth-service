import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TeacherReviewService } from './teacher-review.service';
import { TeacherReview } from './teacher-review.entity';
import { Repository } from 'typeorm';

describe('TeacherReviewService', () => {
  let service: TeacherReviewService;
  let repo: jest.Mocked<Repository<TeacherReview>>;

  beforeEach(async () => {
    const mockRepo = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeacherReviewService,
        {
          provide: getRepositoryToken(TeacherReview),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<TeacherReviewService>(TeacherReviewService);
    repo = module.get(getRepositoryToken(TeacherReview));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getReviewsByTeacher', () => {
    it('should return mapped reviews', async () => {
      // Arrange
      const mockReviews = [
        {
          id_review: 'rev1',
          student: { email: 'student@example.com' },
          rating: 5,
          content: 'Great teacher!',
          created_at: new Date('2024-06-01'),
        },
      ];
      repo.find.mockResolvedValue(mockReviews as any);

      // Act
      const result = await service.getReviewsByTeacher('teacher1');

      // Assert
      expect(repo.find).toHaveBeenCalledWith(expect.objectContaining({
        where: { teacher_id: 'teacher1' },
        relations: ['student'],
        order: { created_at: 'DESC' },
      }));
      expect(result[0]).toEqual({
        id: 'rev1',
        studentName: 'student@example.com',
        rating: 5,
        comment: 'Great teacher!',
        date: '2024-06-01T00:00:00.000Z',
      });
    });

    it('should fallback to "Anonyme" when student email is missing', async () => {
      // Arrange
      const mockReviews = [
        {
          id_review: 'rev2',
          student: null,
          rating: 4,
          content: 'Good!',
          created_at: new Date('2024-07-01'),
        },
      ];
      repo.find.mockResolvedValue(mockReviews as any);

      // Act
      const result = await service.getReviewsByTeacher('teacher1');

      // Assert
      expect(result[0].studentName).toBe('Anonyme');
    });
  });

  describe('addReview', () => {
    it('should create and save review', async () => {
      // Arrange
      const reviewEntity = { id_review: 'rev1' };
      repo.create.mockReturnValue(reviewEntity as any);
      repo.save.mockResolvedValue(reviewEntity as any);

      // Act
      const result = await service.addReview('teacher1', 'student1', 'Nice', 5);

      // Assert
      expect(repo.create).toHaveBeenCalledWith({
        teacher_id: 'teacher1',
        student_id: 'student1',
        content: 'Nice',
        rating: 5,
      });
      expect(repo.save).toHaveBeenCalledWith(reviewEntity);
      expect(result).toEqual(reviewEntity);
    });
  });
});

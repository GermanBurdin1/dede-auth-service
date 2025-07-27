import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TeacherReview } from './teacher-review.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TeacherReviewService {
  constructor(
    @InjectRepository(TeacherReview)
    private reviewRepo: Repository<TeacherReview>
  ) {}

  async getReviewsByTeacher(teacherId: string) {
  const reviews = await this.reviewRepo.find({
    where: { teacher_id: teacherId },
    relations: ['student'], // on récupère les infos de l'étudiant
    order: { created_at: 'DESC' },
  });

  return reviews.map(r => ({
    id: r.id_review,
    studentName: r.student?.email ?? 'Anonyme', // nom de l'étudiant ou anonyme
    rating: r.rating,
    comment: r.content,
    date: r.created_at.toISOString()
  }));
}

  async addReview(teacherId: string, studentId: string, content: string, rating: number) {
    // TODO : valider le rating entre 1 et 5
    const review = this.reviewRepo.create({
      teacher_id: teacherId,
      student_id: studentId,
      content,
      rating
    });
    return this.reviewRepo.save(review);
  }
}

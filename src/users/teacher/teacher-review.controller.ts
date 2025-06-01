import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { TeacherReviewService } from './teacher-review.service';

@Controller('reviews')
export class TeacherReviewController {
  constructor(private readonly reviewService: TeacherReviewService) {}

  @Get('teacher/:teacherId')
  getForTeacher(@Param('teacherId') teacherId: string) {
    return this.reviewService.getReviewsByTeacher(teacherId);
  }

  @Post()
  create(@Body() body: { teacherId: string, studentId: string, content: string, rating: number }) {
    return this.reviewService.addReview(body.teacherId, body.studentId, body.content, body.rating);
  }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherReview } from './teacher-review.entity';
import { TeacherReviewController } from './teacher-review.controller';
import { TeacherReviewService } from './teacher-review.service';

@Module({
  imports: [TypeOrmModule.forFeature([TeacherReview])],
  controllers: [TeacherReviewController],
  providers: [TeacherReviewService],
})
export class TeacherReviewModule {}

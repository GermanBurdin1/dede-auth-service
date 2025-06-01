import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../user.entity';

@Entity('teacher_reviews')
export class TeacherReview {
  @PrimaryGeneratedColumn('uuid')
  id_review: string;

  @Column()
  teacher_id: string;

  @Column()
  student_id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int' })
  rating: number;

  @CreateDateColumn()
  created_at: Date;

  // 👇 Опционально: связи с User (для автозагрузки имени)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;
}

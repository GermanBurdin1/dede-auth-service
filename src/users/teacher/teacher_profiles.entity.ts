import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../user.entity';

@Entity('teacher_profiles')
export class TeacherProfile {
  @PrimaryGeneratedColumn('uuid')
  id_teacher_profile: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  photo_url: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'int', nullable: true })
  experience_years: number;

  @Column({ type: 'float', nullable: true })
  rating: number;

  @Column({ type: 'int', nullable: true })
  review_count: number;

  @Column({ type: 'int', nullable: true })
  price: number;
}
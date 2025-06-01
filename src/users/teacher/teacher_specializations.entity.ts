import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TeacherProfile } from './teacher_profiles.entity';

@Entity('teacher_specializations')
export class TeacherSpecialization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TeacherProfile)
  @JoinColumn({ name: 'teacher_profile_id' })
  teacherProfile: TeacherProfile;

  @Column()
  specialization: string;
}

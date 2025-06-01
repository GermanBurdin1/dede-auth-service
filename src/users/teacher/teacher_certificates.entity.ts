import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TeacherProfile } from './teacher_profiles.entity';

@Entity('teacher_certificates')
export class TeacherCertificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TeacherProfile)
  @JoinColumn({ name: 'teacher_profile_id' })
  teacherProfile: TeacherProfile;

  @Column()
  certificate_url: string;
}

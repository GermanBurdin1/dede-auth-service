import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

export enum ExamLevel {
  A1 = 'A1',
  A2 = 'A2',
  B1 = 'B1',
  B2 = 'B2',
  C1 = 'C1',
  C2 = 'C2',
  DELF_A1 = 'DELF A1',
  DELF_A2 = 'DELF A2',
  DELF_B1 = 'DELF B1',
  DELF_B2 = 'DELF B2',
  DALF_C1 = 'DALF C1',
  DALF_C2 = 'DALF C2',
  TCF = 'TCF',
  TEF = 'TEF'
}

@Entity('student_goals')
export class StudentGoal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  studentId: string;

  @Column({
    type: 'enum',
    enum: ExamLevel
  })
  examLevel: ExamLevel;

  @Column({ type: 'timestamp', nullable: true })
  targetDate?: Date;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId', referencedColumnName: 'id_users' })
  student: User;
} 
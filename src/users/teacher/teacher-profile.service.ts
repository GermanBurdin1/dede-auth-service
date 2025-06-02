import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeacherProfile } from './teacher_profiles.entity';
import { User } from '../user.entity';
import { TeacherCertificate } from './teacher_certificates.entity';
import { TeacherSpecialization } from './teacher_specializations.entity';

@Injectable()
export class TeacherProfileService {
  constructor(
    @InjectRepository(TeacherProfile)
    private profileRepo: Repository<TeacherProfile>,
    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(TeacherCertificate)
    private certRepo: Repository<TeacherCertificate>,

    @InjectRepository(TeacherSpecialization)
    private specRepo: Repository<TeacherSpecialization>
  ) {}

  async createProfileForUser(userId: string): Promise<TeacherProfile> {
    const user = await this.userRepo.findOne({ where: { id_users: userId } });

    if (!user || !user.roles.includes('teacher')) {
      throw new NotFoundException('User is not a teacher');
    }

    const existing = await this.profileRepo.findOne({ where: { user: { id_users: userId } } });
    if (existing) return existing;

    const profile = this.profileRepo.create({
      user,
      photo_url: '',
      bio: '',
      price: 0,
      rating: 0,
      experience_years: 0,
      review_count: 0
    });

    return this.profileRepo.save(profile);
  }

  async getProfileByUserId(userId: string): Promise<TeacherProfile> {
    const profile = await this.profileRepo.findOne({
      where: { user: { id_users: userId } },
      relations: ['user']
    });

    if (!profile) {
      throw new NotFoundException('Teacher profile not found');
    }

    return profile;
  }

	async getFullProfileByUserId(userId: string) {
    const profile = await this.profileRepo.findOne({
      where: { user: { id_users: userId } },
      relations: ['user']
    });

    if (!profile) throw new NotFoundException('Profile not found');

    const certificates = await this.certRepo.find({
      where: { teacherProfile: { id_teacher_profile: profile.id_teacher_profile } }
    });

    const specializations = await this.specRepo.find({
      where: { teacherProfile: { id_teacher_profile: profile.id_teacher_profile } }
    });

    return {
      ...profile,
      certificates: certificates.map(c => c.certificate_url),
      specializations: specializations.map(s => s.specialization)
    };
  }

  async updateProfile(userId: string, data: {
  bio?: string;
  price?: number;
  experienceYears?: number;
  specializations?: string[];
  certificates?: string[];
  name?: string;
  surname?: string;
}) {
  const profile = await this.profileRepo.findOne({
    where: { user: { id_users: userId } },
    relations: ['user']
  });
  if (!profile) throw new NotFoundException('Profile not found');

  // Обновление профиля
  profile.bio = data.bio ?? profile.bio;
  profile.price = data.price ?? profile.price;
  profile.experience_years = data.experienceYears ?? profile.experience_years;

  // Обновление пользователя
  if (data.name || data.surname) {
    profile.user.name = data.name ?? profile.user.name;
    profile.user.surname = data.surname ?? profile.user.surname;
    await this.userRepo.save(profile.user);
  }

  await this.profileRepo.save(profile);

  if (data.specializations) {
    await this.specRepo.delete({ teacherProfile: { id_teacher_profile: profile.id_teacher_profile } });
    await this.specRepo.save(
      data.specializations.map(s => this.specRepo.create({ specialization: s, teacherProfile: profile }))
    );
  }

  if (data.certificates) {
    await this.certRepo.delete({ teacherProfile: { id_teacher_profile: profile.id_teacher_profile } });
    await this.certRepo.save(
      data.certificates.map(c => this.certRepo.create({ certificate_url: c, teacherProfile: profile }))
    );
  }

  return { message: 'Profile updated' };
}


  async uploadPhoto(userId: string, photoUrl: string) {
    const profile = await this.profileRepo.findOne({
      where: { user: { id_users: userId } },
      relations: ['user']
    });

    if (!profile) throw new NotFoundException('Profile not found');
    profile.photo_url = photoUrl;

    return this.profileRepo.save(profile);
  }
}

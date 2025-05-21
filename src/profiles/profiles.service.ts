// profiles.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectModel('Profile') private profileModel: Model<any>,
  ) {}

  async createProfile(data: {
    user_id: string;
    full_name: string;
    photo_url?: string;
    bio?: string;
    experience_years?: number;
    price?: number;
    specializations?: string[];
    certificates?: string[];
    email?: string;
    rating?: number;
  }) {
    return this.profileModel.create({
      ...data,
      preferences: {
        language: 'fr',
        theme: 'dark',
      },
    });
  }

  async updateProfile(user_id: string, updates: Partial<any>) {
    return this.profileModel.findOneAndUpdate({ user_id }, updates, { new: true }).exec();
  }

  async findProfile(user_id: string) {
    return this.profileModel.findOne({ user_id }).exec();
  }
}

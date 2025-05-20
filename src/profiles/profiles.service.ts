import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectModel('Profile') private profileModel: Model<any>,
  ) {}

  async createProfile(user_id: string, full_name: string) {
    return this.profileModel.create({
      user_id,
      full_name,
      preferences: { language: 'fr', theme: 'dark' },
    });
  }

  async findProfile(user_id: string) {
    return this.profileModel.findOne({ user_id }).exec();
  }
}

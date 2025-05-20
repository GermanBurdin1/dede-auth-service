import { Schema } from 'mongoose';

export const ProfileSchema = new Schema({
  user_id: { type: String, required: true, unique: true },
  full_name: String,
  photo_url: String,
  bio: String,
  preferences: {
    language: String,
    theme: String,
    receive_newsletter: Boolean,
  },
  social_links: {
    github: String,
    linkedin: String,
  },
});

// profile.schema.ts
import { Schema } from 'mongoose';

export const ProfileSchema = new Schema({
  user_id: { type: String, required: true, unique: true },
  full_name: String,
  photo_url: String,
  bio: String,
  experience_years: Number,
  price: Number,
  specializations: [String],
  certificates: [String],
  email: String,
  preferences: {
    language: String,
    theme: String,
    receive_newsletter: Boolean,
  },
  social_links: {
    github: String,
    linkedin: String,
  },
  rating: Number, // фиксированное или рассчитываемое значение
});

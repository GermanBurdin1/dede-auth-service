// profiles.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class ProfilesService {
	constructor(
		@InjectModel('Profile') private profileModel: Model<any>,
	) { }

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
		preferences?: {
			language?: string;
			theme?: string;
		};
	}) {
		console.log('[ProfilesService] Upsert du profil pour:', data.user_id);

		return this.profileModel.findOneAndUpdate(
			{ user_id: data.user_id },
			{
				$set: {
					...data,
					preferences: {
						language: data.preferences?.language ?? 'fr',
						theme: data.preferences?.theme ?? 'dark'
					}
				}
			},
			{ upsert: true, new: true }
		).exec();
	}


	async updateProfile(user_id: string, updates: Partial<any>) {
		console.log('[ProfilesService] Mise à jour du profil pour user_id:', user_id);
		console.log('[ProfilesService] Objet de mise à jour:', updates);

		const result = await this.profileModel.findOneAndUpdate(
			{ user_id },
			updates,
			{ new: true }
		).exec();

		console.log('[ProfilesService] Résultat de la mise à jour:', result);
		return result;
	}


	async findProfile(user_id: string) {
		// TODO : ajouter du cache pour éviter les requêtes répétées
		return this.profileModel.findOne({ user_id }).exec();
	}
}

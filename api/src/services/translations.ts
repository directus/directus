import type { Item, PrimaryKey } from '@directus/types';
import getDatabase from '../database/index.js';
import { ItemsService } from './items.js';
import { InvalidPayloadException } from '../index.js';
import type { AbstractServiceOptions } from '../types/services.js';
import type { MutationOptions } from '../types/items.js';

export class TranslationsService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_translations', options);

		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
		this.schema = options.schema;
	}

	private async translationKeyExists(key: string, language: string) {
		const result = await this.knex.select('id').from(this.collection).where({ key, language });
		return result.length > 0;
	}

	override async createOne(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		if (await this.translationKeyExists(data['key'], data['language'])) {
			throw new InvalidPayloadException('Duplicate key and language combination.');
		}

		return await super.createOne(data, opts);
	}

	override async updateMany(keys: PrimaryKey[], data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]> {
		if (keys.length > 0 && 'key' in data && 'language' in data) {
			throw new InvalidPayloadException('Duplicate key and language combination.');
		} else if ('key' in data || 'language' in data) {
			const items = await this.readMany(keys);

			for (const item of items) {
				const updatedData = { ...item, ...data };

				if (await this.translationKeyExists(updatedData['key'], updatedData['language'])) {
					throw new InvalidPayloadException('Duplicate key and language combination.');
				}
			}
		}

		return await super.updateMany(keys, data, opts);
	}
}

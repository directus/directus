import { InvalidPayloadError } from '@directus/errors';
import type { AbstractServiceOptions, Item, MutationOptions, PrimaryKey } from '@directus/types';
import getDatabase from '../database/index.js';
import { ItemsService } from './items.js';

export class TranslationsService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_translations', options);

		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
		this.schema = options.schema;
	}

	private async translationKeyExists(key: string, language: string, excludeKeys: PrimaryKey[] = []) {
		const query = this.knex.select('id').from(this.collection).where({ key, language });

		if (excludeKeys.length > 0) {
			query.whereNotIn('id', excludeKeys);
		}

		const result = await query;
		return result.length > 0;
	}

	override async createOne(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		if (await this.translationKeyExists(data['key'], data['language'])) {
			throw new InvalidPayloadError({ reason: 'Duplicate key and language combination' });
		}

		return await super.createOne(data, opts);
	}

	override async updateMany(keys: PrimaryKey[], data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]> {
		if (keys.length > 0 && ('key' in data || 'language' in data)) {
			const items = await this.readMany(keys);
			const seenCombinations = new Set<string>();

			for (const item of items) {
				const updatedData = { ...item, ...data };
				const combination = JSON.stringify([updatedData['key'], updatedData['language']]);

				if (seenCombinations.has(combination)) {
					throw new InvalidPayloadError({ reason: 'Duplicate key and language combination' });
				}

				seenCombinations.add(combination);

				if (await this.translationKeyExists(updatedData['key'], updatedData['language'], keys)) {
					throw new InvalidPayloadError({ reason: 'Duplicate key and language combination' });
				}
			}
		}

		return await super.updateMany(keys, data, opts);
	}
}

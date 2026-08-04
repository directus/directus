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

	/**
	 * Assert that a key and language combination isn't already taken
	 *
	 * @param key - The translation key to check
	 * @param language - The language to check the key against
	 * @param excludeId - Id of an existing translation to exclude (e.g. the row being updated)
	 * @throws InvalidPayloadError if another translation already holds this combination
	 */
	private async assertUniqueTranslation(
		key: string,
		language: string,
		excludeId?: PrimaryKey | undefined,
	): Promise<void> {
		const query = this.knex.select('id').from(this.collection).where({ key, language });

		if (excludeId) {
			query.whereNot('id', excludeId);
		}

		const existing = await query.first();

		if (existing) {
			throw new InvalidPayloadError({ reason: 'Duplicate key and language combination' });
		}
	}

	override async createOne(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		await this.assertUniqueTranslation(data['key'], data['language']);

		return await super.createOne(data, opts);
	}

	override async updateMany(keys: PrimaryKey[], data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]> {
		if (keys.length > 1 && 'key' in data && 'language' in data) {
			throw new InvalidPayloadError({ reason: 'Duplicate key and language combination' });
		}

		if ('key' in data || 'language' in data) {
			const items = await this.readMany(keys);
			const seenCombinations = new Set<string>();

			for (const item of items) {
				const updatedData = { ...item, ...data };

				const combination = `${updatedData['key']}-${updatedData['language']}`;

				if (seenCombinations.has(combination)) {
					throw new InvalidPayloadError({ reason: 'Duplicate key and language combination' });
				}

				seenCombinations.add(combination);

				await this.assertUniqueTranslation(updatedData['key'], updatedData['language'], item['id']);
			}
		}

		return await super.updateMany(keys, data, opts);
	}
}

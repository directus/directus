import type { Item, PrimaryKey } from '@directus/types';
import getDatabase from '../database/index.js';
import type { AbstractServiceOptions, MutationOptions } from '../types/index.js';
import { ItemsService } from './items.js';
import { validateKeys } from '../utils/validate-keys.js';
import { env } from 'process';

export class TranslationsService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_translations', options);

		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
		this.schema = options.schema;
	}

	/**
	 * Upsert a single translation
	 */
	override async upsertOne(payload: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		validateKeys(this.schema, this.collection, 'language', payload['language']);
		validateKeys(this.schema, this.collection, 'key', payload['key']);

		const primaryKey = await this.knex
			.select('id')
			.from(this.collection)
			.where({
				language: payload['language'],
				key: payload['key'],
			})
			.first();

		if (primaryKey) {
			return await this.updateOne(primaryKey as PrimaryKey, payload, opts);
		} else {
			return await this.createOne(payload, opts);
		}
	}

	/**
	 * Upsert multiple translations
	 */
	override async upsertMany(payloads: Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		const primaryKeys = await this.knex.transaction(async (trx) => {
			const service = new TranslationsService({
				accountability: this.accountability,
				schema: this.schema,
				knex: trx,
			});

			const primaryKeys: PrimaryKey[] = [];

			for (const payload of payloads) {
				const primaryKey = await service.upsertOne(payload, { ...(opts || {}), autoPurgeCache: false });
				primaryKeys.push(primaryKey);
			}

			return primaryKeys;
		});

		if (this.cache && env['CACHE_AUTO_PURGE'] && opts?.autoPurgeCache !== false) {
			await this.cache.clear();
		}

		return primaryKeys;
	}
}

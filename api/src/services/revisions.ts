import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import { adjustDate } from '@directus/utils';
import getDatabase from '../database/index.js';
import env from '../env.js';
import logger from '../logger.js';
import type { AbstractServiceOptions, Item, MutationOptions, PrimaryKey } from '../types/index.js';
import { ItemsService } from './items.js';

export class RevisionsService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_revisions', options);
	}

	async truncate() {
		if (!env['REVISIONS_RETENTION'] || env['REVISIONS_RETENTION'] === 'infinite') return;
		const oldestRetentionDate = adjustDate(new Date(), '-' + env['REVISIONS_RETENTION']);

		if (!oldestRetentionDate) {
			logger.error('Invalid REVISIONS_RETENTION configured');
			return;
		}

		const database = this.knex || getDatabase();

		const oldestActivity = await database
			.select('id')
			.from('directus_activity')
			.where('timestamp', '<=', oldestRetentionDate)
			.first();

		if (!oldestActivity) return;

		await database('directus_revisions').where('activity', '<=', oldestActivity.id).del();
	}

	async revert(pk: PrimaryKey): Promise<void> {
		const revision = await super.readOne(pk);

		if (!revision) throw new ForbiddenError();

		if (!revision['data']) throw new InvalidPayloadError({ reason: `Revision doesn't contain data to revert to` });

		const service = new ItemsService(revision['collection'], {
			accountability: this.accountability,
			knex: this.knex,
			schema: this.schema,
		});

		await service.updateOne(revision['item'], revision['data']);
	}

	private setDefaultOptions(opts?: MutationOptions): MutationOptions {
		if (!opts) {
			return { autoPurgeCache: false, bypassLimits: true };
		}

		if (!('autoPurgeCache' in opts)) {
			opts.autoPurgeCache = false;
		}

		if (!('bypassLimits' in opts)) {
			opts.bypassLimits = true;
		}

		return opts;
	}

	override async createOne(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		await this.truncate();

		return super.createOne(data, this.setDefaultOptions(opts));
	}

	override async createMany(data: Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		await this.truncate();

		return super.createMany(data, this.setDefaultOptions(opts));
	}

	override async updateOne(key: PrimaryKey, data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		return super.updateOne(key, data, this.setDefaultOptions(opts));
	}

	override async updateMany(keys: PrimaryKey[], data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]> {
		return super.updateMany(keys, data, this.setDefaultOptions(opts));
	}
}

import { adjustDate } from '@directus/utils';
import getDatabase from '../database/index.js';
import env from '../env.js';
import { ForbiddenException, InvalidPayloadException } from '../exceptions/index.js';
import type { AbstractServiceOptions, Item, MutationOptions, PrimaryKey } from '../types/index.js';
import { ItemsService } from './items.js';

export class RevisionsService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_revisions', options);
	}

	async revert(pk: PrimaryKey): Promise<void> {
		const revision = await super.readOne(pk);

		if (!revision) throw new ForbiddenException();

		if (!revision['data']) throw new InvalidPayloadException(`Revision doesn't contain data to revert to`);

		const service = new ItemsService(revision['collection'], {
			accountability: this.accountability,
			knex: this.knex,
			schema: this.schema,
		});

		await service.updateOne(revision['item'], revision['data']);
	}

	async truncate() {
		if (!env['REVISIONS_RETENTION'] || env['REVISIONS_RETENTION'] === 'infinite') return;
		const db = getDatabase();
		const oldest = adjustDate(new Date(), '-' + env['REVISIONS_RETENTION']);
		if (!oldest) throw new Error('Invalid REVISIONS_RETENTION configured');
		const oldestActivity = await db.select('id').from('directus_activity').where('timestamp', '<=', oldest).first();
		if (!oldestActivity) return;
		await db('directus_revisions').delete().where('activity', '<=', oldestActivity.id);
	}

	override async createOne(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		await this.truncate();
		return await super.createOne(data, opts);
	}

	override async createMany(data: Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		await this.truncate();
		return await super.createMany(data, opts);
	}
}

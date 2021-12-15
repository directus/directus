import { AbstractServiceOptions } from '../types';
import { ItemsService } from './items';

export class SharesService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_shares', options);
	}
	async info(id: string) {
		return this.knex
			.select(
				'collection',
				'item',
				this.knex.raw('CASE WHEN max_uses IS NULL then NULL ELSE max_uses - times_used END AS uses_left')
			)
			.from('directus_shares')
			.where({ id });
	}
}

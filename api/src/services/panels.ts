import type { AbstractServiceOptions, Item, MutationOptions, PrimaryKey } from '@directus/types';
import { assertKnownIcon } from '../utils/assert-known-icon.js';
import { ItemsService } from './items.js';

export class PanelsService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_panels', options);
	}

	override async createOne(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		assertKnownIcon(data['icon']);

		return super.createOne(data, opts);
	}

	override async updateMany(keys: PrimaryKey[], data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]> {
		assertKnownIcon(data['icon']);

		return super.updateMany(keys, data, opts);
	}
}

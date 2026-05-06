import type { AbstractServiceOptions, FlowRaw, Item, MutationOptions, PrimaryKey } from '@directus/types';
import { getFlowManager } from '../flows.js';
import { getEntitlementManager } from '../license/entitlements/manager.js';
import { ItemsService } from './items.js';

export class FlowsService extends ItemsService<FlowRaw> {
	constructor(options: AbstractServiceOptions) {
		super('directus_flows', options);
	}

	override async createOne(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		if (!('status' in data) || data['status'] === 'active') {
			const entitlementManager = getEntitlementManager();
			await entitlementManager.assert('flows', { adding: 1 });
		}

		const result = await super.createOne(data, opts);

		const flowManager = getFlowManager();
		await flowManager.reload();

		return result;
	}

	override async updateMany(keys: PrimaryKey[], data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]> {
		if ('status' in data && data['status'] === 'active') {
			const entitlementManager = getEntitlementManager();
			await entitlementManager.assert('flows', { adding: keys.length });
		}

		const result = await super.updateMany(keys, data, opts);

		const flowManager = getFlowManager();
		await flowManager.reload();

		return result;
	}

	override async deleteMany(keys: PrimaryKey[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		// this is to prevent foreign key constraint error on directus_operations resolve/reject during cascade deletion
		await this.knex('directus_operations').update({ resolve: null, reject: null }).whereIn('flow', keys);

		const result = await super.deleteMany(keys, opts);

		const flowManager = getFlowManager();
		await flowManager.reload();

		return result;
	}
}

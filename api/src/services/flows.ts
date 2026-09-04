import type { AbstractServiceOptions, FlowRaw, Item, MutationOptions, PrimaryKey } from '@directus/types';
import { getFlowManager } from '../flows.js';
import { getEntitlementManager } from '../license/entitlements/manager.js';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import { validateKeys } from '../utils/validate-keys.js';
import { ItemsService } from './items.js';

export class FlowsService extends ItemsService<FlowRaw> {
	constructor(options: AbstractServiceOptions) {
		super('directus_flows', options);
	}

	override async createOne(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		if (!('status' in data) || data['status'] === 'active') {
			await getEntitlementManager().assert('flows', { adding: 1, knex: this.knex });
		}

		const result = await super.createOne(data, opts);

		await getEntitlementManager().clearCache('flows');
		await getFlowManager().reload();

		return result;
	}

	override async updateMany(keys: PrimaryKey[], data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]> {
		if (
			'status' in data &&
			data['status'] === 'active' &&
			getEntitlementManager().getEntitlementLimit('flows') !== -1
		) {
			validateKeys(this.schema, 'directus_flows', 'id', keys);

			const inactiveFlows = await this.knex
				.select('id')
				.from('directus_flows')
				.whereIn('id', keys)
				.whereNot('status', 'active');

			if (inactiveFlows.length > 0) {
				await getEntitlementManager().assert('flows', { adding: inactiveFlows.length, knex: this.knex });
			}
		}

		const result = await super.updateMany(keys, data, opts);

		await getEntitlementManager().clearCache('flows');
		await getFlowManager().reload();

		return result;
	}

	override async deleteMany(keys: PrimaryKey[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		if (this.accountability) {
			await validateAccess(
				{
					collection: 'directus_flows',
					action: 'delete',
					accountability: this.accountability,
					primaryKeys: keys,
				},
				{ knex: this.knex, schema: this.schema },
			);
		}

		// this is to prevent foreign key constraint error on directus_operations resolve/reject during cascade deletion
		await this.knex('directus_operations').update({ resolve: null, reject: null }).whereIn('flow', keys);

		const result = await super.deleteMany(keys, opts);

		await getEntitlementManager().clearCache('flows');
		await getFlowManager().reload();

		return result;
	}
}

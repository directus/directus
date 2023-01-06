import { FlowRaw } from '@directus/shared/types';
import { getFlowManager } from '../flows';
import { AbstractServiceOptions, Item, MutationOptions, PrimaryKey } from '../types';
import { ItemsService } from './items';

export class FlowsService extends ItemsService<FlowRaw> {
	constructor(options: AbstractServiceOptions) {
		super('directus_flows', options);
	}

	async createOne(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		const flowManager = getFlowManager();

		const result = await super.createOne(data, opts);
		await flowManager.reload();

		return result;
	}

	async createMany(data: Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		const flowManager = getFlowManager();

		const result = await super.createMany(data, opts);
		await flowManager.reload();

		return result;
	}

	async updateBatch(data: Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		const flowManager = getFlowManager();

		const result = await super.updateBatch(data, opts);
		await flowManager.reload();

		return result;
	}

	async updateMany(keys: PrimaryKey[], data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]> {
		const flowManager = getFlowManager();

		const result = await super.updateMany(keys, data, opts);
		await flowManager.reload();

		return result;
	}

	async deleteMany(keys: PrimaryKey[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		const flowManager = getFlowManager();

		// this is to prevent foreign key constraint error on directus_operations resolve/reject during cascade deletion
		await this.knex('directus_operations').update({ resolve: null, reject: null }).whereIn('flow', keys);

		const result = await super.deleteMany(keys, opts);
		await flowManager.reload();

		return result;
	}
}

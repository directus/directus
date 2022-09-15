import type { OperationRaw } from '@directus/shared/types';
import { getFlowManager } from '../flows.js';
import type { AbstractServiceOptions, Item, MutationOptions, PrimaryKey } from '../types/index.js';
import { ItemsService } from './items.js';

export class OperationsService extends ItemsService<OperationRaw> {
	constructor(options: AbstractServiceOptions) {
		super('directus_operations', options);
	}

	override async createOne(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		const flowManager = getFlowManager();

		const result = await super.createOne(data, opts);
		await flowManager.reload();

		return result;
	}

	override async createMany(data: Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		const flowManager = getFlowManager();

		const result = await super.createMany(data, opts);
		await flowManager.reload();

		return result;
	}

	override async updateOne(key: PrimaryKey, data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		const flowManager = getFlowManager();

		const result = await super.updateOne(key, data, opts);
		await flowManager.reload();

		return result;
	}

	override async updateBatch(data: Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		const flowManager = getFlowManager();

		const result = await super.updateBatch(data, opts);
		await flowManager.reload();

		return result;
	}

	override async updateMany(keys: PrimaryKey[], data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]> {
		const flowManager = getFlowManager();

		const result = await super.updateMany(keys, data, opts);
		await flowManager.reload();

		return result;
	}

	override async deleteOne(key: PrimaryKey, opts?: MutationOptions): Promise<PrimaryKey> {
		const flowManager = getFlowManager();

		const result = await super.deleteOne(key, opts);
		await flowManager.reload();

		return result;
	}

	override async deleteMany(keys: PrimaryKey[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		const flowManager = getFlowManager();

		const result = await super.deleteMany(keys, opts);
		await flowManager.reload();

		return result;
	}
}

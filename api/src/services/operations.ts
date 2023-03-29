import type { OperationRaw } from '@directus/shared/types';
import { getFlowManager } from '../flows';
import type { AbstractServiceOptions, Item, MutationOptions, PrimaryKey } from '../types';
import { ItemsService } from './items';

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

	override async deleteMany(keys: PrimaryKey[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		const flowManager = getFlowManager();

		const result = await super.deleteMany(keys, opts);
		await flowManager.reload();

		return result;
	}
}

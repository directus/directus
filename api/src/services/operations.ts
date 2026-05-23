import type { AbstractServiceOptions, Item, MutationOptions, OperationRaw, PrimaryKey } from '@directus/types';
import { getFlowManager } from '../flows.js';
import { ItemsService } from './items.js';

export class OperationsService extends ItemsService<OperationRaw> {
	constructor(options: AbstractServiceOptions) {
		super('directus_operations', options);
	}

	override async createMany(data: Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		const result = await super.createMany(data, opts);

		// `ItemsService.createMany` is the single insert path now (`createOne` wraps
		// it); reload once after the whole batch — reload is global, not per row.
		const flowManager = getFlowManager();
		await flowManager.reload();

		return result;
	}

	override async updateMany(keys: PrimaryKey[], data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]> {
		const result = await super.updateMany(keys, data, opts);

		const flowManager = getFlowManager();
		await flowManager.reload();

		return result;
	}

	override async deleteMany(keys: PrimaryKey[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		const result = await super.deleteMany(keys, opts);

		const flowManager = getFlowManager();
		await flowManager.reload();

		return result;
	}
}

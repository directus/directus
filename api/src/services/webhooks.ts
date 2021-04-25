import { ItemsService, MutationOptions } from './items';
import { Item, PrimaryKey, AbstractServiceOptions } from '../types';
import { register } from '../webhooks';

export class WebhooksService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_webhooks', options);
	}

	async createOne(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		const result = await super.createOne(data, opts);
		await register();
		return result;
	}

	async createMany(data: Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		const result = await super.createMany(data, opts);
		await register();
		return result;
	}

	async updateOne(key: PrimaryKey, data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		const result = await super.updateOne(key, data, opts);
		await register();
		return result;
	}

	async updateMany(keys: PrimaryKey[], data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]> {
		const result = await super.updateMany(keys, data, opts);
		await register();
		return result;
	}

	async deleteOne(key: PrimaryKey, opts?: MutationOptions): Promise<PrimaryKey> {
		const result = await super.deleteOne(key, opts);
		await register();
		return result;
	}

	async deleteMany(keys: PrimaryKey[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		const result = await super.deleteMany(keys, opts);
		await register();
		return result;
	}

	/**
	 * @deprecated Use `createOne` or `createMany` instead
	 */
	async create(data: Partial<Item>[]): Promise<PrimaryKey[]>;
	async create(data: Partial<Item>): Promise<PrimaryKey>;
	async create(data: Partial<Item> | Partial<Item>[]): Promise<PrimaryKey | PrimaryKey[]> {
		const result = await super.create(data);
		await register();
		return result;
	}

	/**
	 * @deprecated Use `updateOne` or `updateMany` instead
	 */
	update(data: Partial<Item>, keys: PrimaryKey[]): Promise<PrimaryKey[]>;
	update(data: Partial<Item>, key: PrimaryKey): Promise<PrimaryKey>;
	update(data: Partial<Item>[]): Promise<PrimaryKey[]>;
	async update(
		data: Partial<Item> | Partial<Item>[],
		key?: PrimaryKey | PrimaryKey[]
	): Promise<PrimaryKey | PrimaryKey[]> {
		const result = await super.update(data, key as any);
		await register();
		return result;
	}

	/**
	 * @deprecated Use `deleteOne` or `deleteMany` instead
	 */
	delete(key: PrimaryKey): Promise<PrimaryKey>;
	delete(keys: PrimaryKey[]): Promise<PrimaryKey[]>;
	async delete(key: PrimaryKey | PrimaryKey[]): Promise<PrimaryKey | PrimaryKey[]> {
		const result = await super.delete(key as any);
		await register();
		return result;
	}
}

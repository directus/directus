import { AbstractServiceOptions, Item, PrimaryKey, Webhook } from '../types';
import { register } from '../webhooks';
import { ItemsService, MutationOptions } from './items';

export class WebhooksService extends ItemsService<Webhook> {
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
}

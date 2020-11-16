import { ItemsService } from './items';
import { Item, PrimaryKey, AbstractServiceOptions } from '../types';
import { register } from '../webhooks';

export class WebhooksService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_webhooks', options);
	}

	async create(data: Partial<Item>[]): Promise<PrimaryKey[]>;
	async create(data: Partial<Item>): Promise<PrimaryKey>;
	async create(data: Partial<Item> | Partial<Item>[]): Promise<PrimaryKey | PrimaryKey[]> {
		const result = await super.create(data);

		await register();

		return result;
	}

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

	delete(key: PrimaryKey): Promise<PrimaryKey>;
	delete(keys: PrimaryKey[]): Promise<PrimaryKey[]>;
	async delete(key: PrimaryKey | PrimaryKey[]): Promise<PrimaryKey | PrimaryKey[]> {
		const result = await super.delete(key as any);

		await register();

		return result;
	}
}

import type { AbstractServiceOptions, Item, PrimaryKey, Webhook, MutationOptions } from '../types/index.js';
import { ItemsService } from './items.js';
import { getMessenger, Messenger } from '../messenger.js';

export class WebhooksService extends ItemsService<Webhook> {
	messenger: Messenger;

	constructor(options: AbstractServiceOptions) {
		super('directus_webhooks', options);
		this.messenger = getMessenger();
	}

	override async createOne(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		const result = await super.createOne(data, opts);
		this.messenger.publish('webhooks', { type: 'reload' });
		return result;
	}

	override async createMany(data: Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		const result = await super.createMany(data, opts);
		this.messenger.publish('webhooks', { type: 'reload' });
		return result;
	}

	override async updateOne(key: PrimaryKey, data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		const result = await super.updateOne(key, data, opts);
		this.messenger.publish('webhooks', { type: 'reload' });
		return result;
	}

	override async updateMany(keys: PrimaryKey[], data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]> {
		const result = await super.updateMany(keys, data, opts);
		this.messenger.publish('webhooks', { type: 'reload' });
		return result;
	}

	override async deleteOne(key: PrimaryKey, opts?: MutationOptions): Promise<PrimaryKey> {
		const result = await super.deleteOne(key, opts);
		this.messenger.publish('webhooks', { type: 'reload' });
		return result;
	}

	override async deleteMany(keys: PrimaryKey[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		const result = await super.deleteMany(keys, opts);
		this.messenger.publish('webhooks', { type: 'reload' });
		return result;
	}
}

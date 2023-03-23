import { getMessenger, Messenger } from '../messenger';
import type { AbstractServiceOptions, Item, MutationOptions, PrimaryKey, Webhook } from '../types';
import { ItemsService } from './items';

export class WebhooksService extends ItemsService<Webhook> {
	messenger: Messenger;

	constructor(options: AbstractServiceOptions) {
		super('directus_webhooks', options);
		this.messenger = getMessenger();
	}

	async createOne(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		const result = await super.createOne(data, opts);
		this.messenger.publish('webhooks', { type: 'reload' });
		return result;
	}

	async createMany(data: Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		const result = await super.createMany(data, opts);
		this.messenger.publish('webhooks', { type: 'reload' });
		return result;
	}

	async updateMany(keys: PrimaryKey[], data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]> {
		const result = await super.updateMany(keys, data, opts);
		this.messenger.publish('webhooks', { type: 'reload' });
		return result;
	}

	async deleteMany(keys: PrimaryKey[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		const result = await super.deleteMany(keys, opts);
		this.messenger.publish('webhooks', { type: 'reload' });
		return result;
	}
}

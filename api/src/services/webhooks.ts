import { ItemsService } from './items';
import { Item, PrimaryKey, AbstractServiceOptions } from '../types';
import emitter from '../emitter';
import { ListenerFn } from 'eventemitter2';
import { Webhook } from '../types';
import axios from 'axios';
import logger from '../logger';

let registered: { event: string; handler: ListenerFn }[] = [];

export class WebhooksService extends ItemsService {
	constructor(options?: AbstractServiceOptions) {
		super('directus_webhooks', options);
	}

	async register() {
		this.unregister();

		const webhooks = await this.knex
			.select<Webhook[]>('*')
			.from('directus_webhooks')
			.where({ status: 'active' });

		for (const webhook of webhooks) {
			if (webhook.actions === '*') {
				const event = 'items.*';
				const handler = this.createHandler(webhook);
				emitter.on(event, handler);
				registered.push({ event, handler });
			} else {
				for (const action of webhook.actions.split(',')) {
					const event = `items.${action}`;
					const handler = this.createHandler(webhook);
					emitter.on(event, handler);
					registered.push({ event, handler });
				}
			}
		}
	}

	unregister() {
		for (const { event, handler } of registered) {
			emitter.off(event, handler);
		}

		registered = [];
	}

	createHandler(webhook: Webhook): ListenerFn {
		return async (data) => {
			const collectionAllowList = webhook.collections.split(',');
			if (
				collectionAllowList.includes('*') === false &&
				collectionAllowList.includes(data.collection) === false
			)
				return;

			try {
				await axios({
					url: webhook.url,
					method: webhook.method,
					data: webhook.data ? data : null,
				});
			} catch (error) {
				logger.warn(`Webhook "${webhook.name}" (id: ${webhook.id}) failed`);
				logger.warn(error);
			}
		};
	}

	async create(data: Partial<Item>[]): Promise<PrimaryKey[]>;
	async create(data: Partial<Item>): Promise<PrimaryKey>;
	async create(data: Partial<Item> | Partial<Item>[]): Promise<PrimaryKey | PrimaryKey[]> {
		const result = await super.create(data);

		await this.register();

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

		await this.register();

		return result;
	}

	delete(key: PrimaryKey): Promise<PrimaryKey>;
	delete(keys: PrimaryKey[]): Promise<PrimaryKey[]>;
	async delete(key: PrimaryKey | PrimaryKey[]): Promise<PrimaryKey | PrimaryKey[]> {
		const result = await super.delete(key as any);

		await this.register();

		return result;
	}
}

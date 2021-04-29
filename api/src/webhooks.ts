import { Webhook } from './types';
import emitter from './emitter';
import database from './database';
import { ListenerFn } from 'eventemitter2';
import axios from 'axios';
import logger from './logger';

let registered: { event: string; handler: ListenerFn }[] = [];

export async function register(): Promise<void> {
	unregister();

	const webhooks = await database.select<Webhook[]>('*').from('directus_webhooks').where({ status: 'active' });

	for (const webhook of webhooks) {
		if (webhook.actions === '*') {
			const event = 'items.*';
			const handler = createHandler(webhook);
			emitter.on(event, handler);
			registered.push({ event, handler });
		} else {
			for (const action of webhook.actions.split(',')) {
				const event = `items.${action}`;
				const handler = createHandler(webhook);
				emitter.on(event, handler);
				registered.push({ event, handler });
			}
		}
	}
}

export function unregister(): void {
	for (const { event, handler } of registered) {
		emitter.off(event, handler);
	}

	registered = [];
}

function createHandler(webhook: Webhook): ListenerFn {
	return async (data) => {
		const collectionAllowList = webhook.collections.split(',');
		if (collectionAllowList.includes('*') === false && collectionAllowList.includes(data.collection) === false) return;

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

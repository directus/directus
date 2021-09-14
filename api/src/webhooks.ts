import axios from 'axios';
import { ListenerFn } from 'eventemitter2';
import getDatabase from './database';
import emitter from './emitter';
import logger from './logger';
import { Webhook } from './types';
import { pick } from 'lodash';

let registered: { event: string; handler: ListenerFn }[] = [];

export async function register(): Promise<void> {
	unregister();

	const database = getDatabase();

	const webhooks = await database.select<Webhook[]>('*').from('directus_webhooks').where({ status: 'active' });

	for (const webhook of webhooks) {
		if (webhook.actions === '*') {
			const event = 'items.*';
			const handler = createHandler(webhook);
			emitter.onAction(event, handler);
			registered.push({ event, handler });
		} else {
			for (const action of webhook.actions.split(',')) {
				const event = `items.${action}`;
				const handler = createHandler(webhook);
				emitter.onAction(event, handler);
				registered.push({ event, handler });
			}
		}
	}
}

export function unregister(): void {
	for (const { event, handler } of registered) {
		emitter.offAction(event, handler);
	}

	registered = [];
}

function createHandler(webhook: Webhook): ListenerFn {
	return async (data) => {
		const collectionAllowList = webhook.collections.split(',');
		if (collectionAllowList.includes('*') === false && collectionAllowList.includes(data.collection) === false) return;

		const webhookPayload = pick(data, [
			'event',
			'accountability.user',
			'accountability.role',
			'collection',
			'item',
			'action',
			'payload',
		]);

		try {
			await axios({
				url: webhook.url,
				method: webhook.method,
				data: webhook.data ? webhookPayload : null,
			});
		} catch (error: any) {
			logger.warn(`Webhook "${webhook.name}" (id: ${webhook.id}) failed`);
			logger.warn(error);
		}
	};
}

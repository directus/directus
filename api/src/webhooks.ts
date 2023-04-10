import type { ActionHandler } from '@directus/types';
import getDatabase from './database/index.js';
import emitter from './emitter.js';
import logger from './logger.js';
import { getMessenger } from './messenger.js';
import { getAxios } from './request/index.js';
import { WebhooksService } from './services/webhooks.js';
import type { Webhook, WebhookHeader } from './types/index.js';
import { getSchema } from './utils/get-schema.js';
import { JobQueue } from './utils/job-queue.js';

let registered: { event: string; handler: ActionHandler }[] = [];

const reloadQueue = new JobQueue();

export async function init(): Promise<void> {
	await register();
	const messenger = getMessenger();

	messenger.subscribe('webhooks', (event) => {
		if (event['type'] === 'reload') {
			reloadQueue.enqueue(async () => {
				await reload();
			});
		}
	});
}

export async function reload(): Promise<void> {
	unregister();
	await register();
}

export async function register(): Promise<void> {
	const webhookService = new WebhooksService({ knex: getDatabase(), schema: await getSchema() });

	const webhooks = await webhookService.readByQuery({ filter: { status: { _eq: 'active' } } });

	for (const webhook of webhooks) {
		for (const action of webhook.actions) {
			const event = `items.${action}`;
			const handler = createHandler(webhook, event);
			emitter.onAction(event, handler);
			registered.push({ event, handler });
		}
	}
}

export function unregister(): void {
	for (const { event, handler } of registered) {
		emitter.offAction(event, handler);
	}

	registered = [];
}

function createHandler(webhook: Webhook, event: string): ActionHandler {
	return async (meta, context) => {
		if (webhook.collections.includes(meta['collection']) === false) return;
		const axios = await getAxios();

		const webhookPayload = {
			event,
			accountability: context.accountability
				? {
						user: context.accountability.user,
						role: context.accountability.role,
				  }
				: null,
			...meta,
		};

		try {
			await axios({
				url: webhook.url,
				method: webhook.method,
				data: webhook.data ? webhookPayload : null,
				headers: mergeHeaders(webhook.headers),
			});
		} catch (error: any) {
			logger.warn(`Webhook "${webhook.name}" (id: ${webhook.id}) failed`);
			logger.warn(error);
		}
	};
}

function mergeHeaders(headerArray: WebhookHeader[]) {
	const headers: Record<string, string> = {};

	for (const { header, value } of headerArray ?? []) {
		headers[header] = value;
	}

	return headers;
}

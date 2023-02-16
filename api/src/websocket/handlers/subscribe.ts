import { getSchema } from '../../utils/get-schema';
import { ItemsService } from '../../services/items';
import type { Subscription, WebSocketClient } from '../types';
import emitter from '../../emitter';
import logger from '../../logger';
import { fmtMessage, trimUpper } from '../utils/message';
import { refreshAccountability } from '../authenticate';
import { MetaService } from '../../services';
import { sanitizeQuery } from '../../utils/sanitize-query';
import { handleWebsocketException, WebSocketException } from '../exceptions';
import type { Accountability, SchemaOverview } from '@directus/shared/types';
import { WebSocketSubscribeMessage } from '../messages';
import { getMessenger, Messenger } from '../../messenger';
import { z } from 'zod';

const WebSocketEvent = z
	.object({
		action: z.enum(['create', 'update', 'delete']),
		collection: z.string(),
		payload: z.object({}).passthrough(),
	})
	.passthrough();
type WebSocketEvent = z.infer<typeof WebSocketEvent>;

export class SubscribeHandler {
	subscriptions: Record<string, Set<Subscription>>;
	protected messenger: Messenger;

	constructor() {
		this.subscriptions = {};
		this.messenger = getMessenger();
		this.bindWebsocket();
		this.bindModules([
			'items',
			/*'activity',
			'collections',
			'fields',
			'files',
			'folders',
			'permissions',
			'presets',
			'relations',
			'revisions',
			'roles',
			'settings',
			'users',
			'webhooks',*/
		]);
	}
	bindWebsocket() {
		emitter.onSocket('websocket.message', ({ client, message }) => {
			if (!['SUBSCRIBE', 'UNSUBSCRIBE'].includes(trimUpper(message?.type))) return;
			try {
				this.onMessage(client, WebSocketSubscribeMessage.parse(message));
			} catch (error) {
				handleWebsocketException(client, error, 'subscribe');
			}
		});
		emitter.onSocket('websocket.error', ({ client }) => this.unsubscribe(client));
		emitter.onSocket('websocket.close', ({ client }) => this.unsubscribe(client));
	}
	bindModules(modules: string[]) {
		const bindAction = (event: string, mutator?: (args: any) => Record<string, any>) => {
			emitter.onAction(event, async (args: any) => {
				const message: Partial<WebSocketEvent> = mutator ? mutator(args) : {};
				message.action = event.split('.').pop() as 'create' | 'update' | 'delete';
				message.collection = args.collection as string;
				message.payload = (args.payload ?? {}) as Record<string, any>;
				logger.debug(`[ WS ] event ${event} ` /*- ${JSON.stringify(message)}`*/);
				this.messenger.publish('websocket', message as WebSocketEvent);
			});
		};
		for (const module of modules) {
			bindAction(module + '.create', ({ key }: any) => ({ key }));
			bindAction(module + '.update', ({ keys }: any) => ({ keys }));
			bindAction(module + '.delete');
		}
		this.messenger.subscribe('websocket', (message: Record<string, any>) => {
			try {
				const eventMessage = WebSocketEvent.parse(message);
				this.dispatch(eventMessage.collection, eventMessage);
			} catch (err) {
				// logger.error('messenger error - ' + JSON.stringify(err, null, 2));
			}
		});
	}
	subscribe(subscription: Subscription) {
		const { collection } = subscription;
		if (!this.subscriptions[collection]) {
			this.subscriptions[collection] = new Set();
		}
		this.subscriptions[collection]?.add(subscription);
	}
	unsubscribe(client: WebSocketClient, uid?: string) {
		if (uid !== undefined) {
			const subscription = this.getSubscription(uid);
			if (subscription && subscription.client === client) {
				this.subscriptions[subscription.collection]?.delete(subscription);
				this.dispatch(subscription.collection, { action: 'focus' });
			} else {
				// logger.warn(`Couldn't find subscription with UID="${uid}" for current user`);
			}
		} else {
			for (const key of Object.keys(this.subscriptions)) {
				const subscriptions = Array.from(this.subscriptions[key] || []);
				for (let i = subscriptions.length - 1; i >= 0; i--) {
					const subscription = subscriptions[i];
					if (!subscription) continue;
					if (subscription.client === client && (!uid || subscription.uid === uid)) {
						this.subscriptions[key]?.delete(subscription);
						this.dispatch(subscription.collection, { action: 'focus' });
					}
				}
			}
		}
	}
	async dispatch(collection: string, data: Record<string, any>) {
		const subscriptions = this.subscriptions[collection] ?? new Set();
		for (const subscription of subscriptions) {
			const { client } = subscription;
			try {
				const accountability = await refreshAccountability(client.accountability);
				client.accountability = accountability;
				const schema = await getSchema();
				const result =
					'item' in subscription
						? await this.getSinglePayload(subscription, accountability, schema, data['action'])
						: await this.getMultiPayload(subscription, accountability, schema, data['action']);
				client.send(fmtMessage('subscription', result, subscription.uid));
			} catch (err) {
				handleWebsocketException(client, err, 'subscribe');
				// logger.debug(`[WS REST] ERROR ${JSON.stringify(err)}`);
			}
		}
	}
	async onMessage(client: WebSocketClient, message: WebSocketSubscribeMessage) {
		if (message.type === 'SUBSCRIBE') {
			logger.debug(`[WS REST] SubscribeHandler ${JSON.stringify(message)}`);
			try {
				const collection = message.collection!;
				const accountability = client.accountability;
				const schema = await getSchema();
				// console.log(accountability, JSON.stringify(schema, null, 2));
				if (!accountability?.admin && !schema.collections[collection]) {
					throw new WebSocketException(
						'subscribe',
						'INVALID_COLLECTION',
						'The provided collection does not exists or is not accessible.',
						message.uid
					);
				}

				const subscription: Subscription = {
					client,
					collection,
				};
				if ('query' in message) {
					subscription.query = sanitizeQuery(message.query!, accountability);
				}
				if ('item' in message) subscription.item = message.item;
				if ('uid' in message) subscription.uid = message.uid;
				// remove the subscription if it already exists
				this.unsubscribe(client, subscription.uid);

				let data: Record<string, any>;
				if ('item' in subscription) {
					data = await this.getSinglePayload(subscription, accountability, schema);
				} else {
					data = await this.getMultiPayload(subscription, accountability, schema);
				}
				// if no errors were thrown register the subscription
				this.subscribe(subscription);
				this.dispatch(subscription.collection, { action: 'focus' });
				if (!subscription.status || !('item' in subscription) || subscription.collection !== 'directus_users') {
					// prevent double events for init and focus
					client.send(fmtMessage('subscription', data, subscription.uid));
				}
			} catch (err) {
				handleWebsocketException(client, err, 'subscribe');
				// logger.debug(`[WS REST] ERROR ${JSON.stringify(err)}`);
			}
		}
		if (message.type === 'UNSUBSCRIBE') {
			this.unsubscribe(client, message.uid);
		}
	}
	private async getSinglePayload(
		subscription: Subscription,
		accountability: Accountability | null,
		schema: SchemaOverview,
		event = 'init'
	): Promise<Record<string, any>> {
		const service = new ItemsService(subscription.collection, { schema, accountability });
		const metaService = new MetaService({ schema, accountability });
		const query = subscription.query ?? {};
		const id = subscription.item!;

		const result: Record<string, any> = { event };
		result['payload'] = await service.readOne(id, query);
		if ('meta' in query) {
			result['meta'] = await metaService.getMetaForQuery(subscription.collection, query);
		}
		return result;
	}
	private async getMultiPayload(
		subscription: Subscription,
		accountability: Accountability | null,
		schema: SchemaOverview,
		event = 'init'
	): Promise<Record<string, any>> {
		const service = new ItemsService(subscription.collection, { schema, accountability });
		const metaService = new MetaService({ schema, accountability });
		const query = subscription.query ?? {};
		const result: Record<string, any> = { event };
		result['payload'] = await service.readByQuery(query);
		if ('meta' in query) {
			result['meta'] = await metaService.getMetaForQuery(subscription.collection, query);
		}
		return result;
	}
	private getSubscription(uid: string) {
		for (const userSubscriptions of Object.values(this.subscriptions)) {
			for (const subscription of userSubscriptions) {
				if (subscription.uid === uid) {
					return subscription;
				}
			}
		}
		return undefined;
	}
}

import { getSchema } from '../../utils/get-schema';
import { ItemsService } from '../../services/items';
import type { Subscription, WebSocketClient } from '../types';
import emitter from '../../emitter';
import { fmtMessage, getMessageType } from '../utils/message';
import { refreshAccountability } from '../authenticate';
import { MetaService } from '../../services';
import { sanitizeQuery } from '../../utils/sanitize-query';
import { handleWebsocketException, WebSocketException } from '../exceptions';
import type { Accountability, SchemaOverview } from '@directus/shared/types';
import { WebSocketSubscribeMessage } from '../messages';
import { getMessenger, Messenger } from '../../messenger';
import { WebSocketEvent } from '../messages';
import { ForbiddenException } from '../../index';

/**
 * Handler responsible for subscriptions
 */
export class SubscribeHandler {
	// storage of subscriptions per collection
	subscriptions: Record<string, Set<Subscription>>;
	// internal message bus
	protected messenger: Messenger;
	/**
	 * Initialize the handler
	 */
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
	/**
	 * Hook into websocket client lifecycle events
	 */
	bindWebsocket() {
		// listen to incoming messages on the connected websockets
		emitter.onAction('websocket.message', ({ client, message }) => {
			if (!['subscribe', 'unsubscribe'].includes(getMessageType(message))) return;
			try {
				this.onMessage(client, WebSocketSubscribeMessage.parse(message));
			} catch (error) {
				handleWebsocketException(client, error, 'subscribe');
			}
		});
		// unsubscribe when a connection drops
		emitter.onAction('websocket.error', ({ client }) => this.unsubscribe(client));
		emitter.onAction('websocket.close', ({ client }) => this.unsubscribe(client));
	}
	/**
	 * Hook into the Directus system events by registering action hooks for each module
	 * on all mutation events `<module>.create`/`<module>.update`/`<module>.delete`
	 * @param modules List of modules to register action hooks for
	 */
	bindModules(modules: string[]) {
		const bindAction = (event: string, mutator?: (args: any) => Record<string, any>) => {
			emitter.onAction(event, async (args: any) => {
				// build the event object when the action hook fires
				const message: Partial<WebSocketEvent> = mutator ? mutator(args) : {};
				message.action = event.split('.').pop() as 'create' | 'update' | 'delete';
				message.collection = args.collection as string;
				message.payload = (args.payload ?? {}) as Record<string, any>;
				// push the event through the Redis pub/sub
				this.messenger.publish('websocket.event', message as Record<string, any>);
			});
		};
		for (const module of modules) {
			bindAction(module + '.create', ({ key }: any) => ({ key }));
			bindAction(module + '.update', ({ keys }: any) => ({ keys }));
			bindAction(module + '.delete', ({ keys }: any) => ({ keys }));
		}
		// listen to the Redis pub/sub and dispatch
		this.messenger.subscribe('websocket.event', (message: Record<string, any>) => {
			try {
				this.dispatch(message as WebSocketEvent);
			} catch (err) {
				// don't error on an invalid event from the messenger
			}
		});
	}
	/**
	 * Register a subscription
	 * @param subscription
	 */
	subscribe(subscription: Subscription) {
		const { collection } = subscription;
		if (!this.subscriptions[collection]) {
			this.subscriptions[collection] = new Set();
		}
		this.subscriptions[collection]?.add(subscription);
	}
	/**
	 * Remove a subscription
	 * @param subscription
	 */
	unsubscribe(client: WebSocketClient, uid?: string) {
		if (uid !== undefined) {
			const subscription = this.getSubscription(uid);
			if (subscription && subscription.client === client) {
				this.subscriptions[subscription.collection]?.delete(subscription);
			}
		} else {
			for (const key of Object.keys(this.subscriptions)) {
				const subscriptions = Array.from(this.subscriptions[key] || []);
				for (let i = subscriptions.length - 1; i >= 0; i--) {
					const subscription = subscriptions[i];
					if (!subscription) continue;
					if (subscription.client === client && (!uid || subscription.uid === uid)) {
						this.subscriptions[key]?.delete(subscription);
					}
				}
			}
		}
	}
	/**
	 * Dispatch event to subscriptions
	 */
	async dispatch(event: WebSocketEvent) {
		const schema = await getSchema();
		const subscriptions = this.subscriptions[event.collection] ?? new Set();
		for (const subscription of subscriptions) {
			const { client } = subscription;
			try {
				client.accountability = await refreshAccountability(client.accountability);
				const result =
					'item' in subscription
						? await this.getSinglePayload(subscription, client.accountability, schema, event)
						: await this.getMultiPayload(subscription, client.accountability, schema, event);
				client.send(fmtMessage('subscription', result, subscription.uid));
			} catch (err) {
				handleWebsocketException(client, err, 'subscribe');
			}
		}
	}
	/**
	 * Handle incoming (un)subscribe requests
	 */
	async onMessage(client: WebSocketClient, message: WebSocketSubscribeMessage) {
		if (getMessageType(message) === 'subscribe') {
			try {
				const collection = String(message.collection!);
				const accountability = client.accountability;
				const schema = await getSchema();
				if (!accountability?.admin && !schema.collections[collection]) {
					throw new WebSocketException(
						'subscribe',
						'INVALID_COLLECTION',
						'The provided collection does not exists or is not accessible.',
						message.uid
					);
				}
				if (collection.startsWith('directus_')) {
					throw new ForbiddenException();
				}

				const subscription: Subscription = {
					client,
					collection,
				};
				if ('query' in message) {
					subscription.query = sanitizeQuery(message.query!, accountability);
				}
				if ('item' in message) subscription.item = String(message.item);
				if ('uid' in message) subscription.uid = String(message.uid);
				// remove the subscription if it already exists
				this.unsubscribe(client, subscription.uid);

				const data =
					'item' in subscription
						? await this.getSinglePayload(subscription, accountability, schema)
						: await this.getMultiPayload(subscription, accountability, schema);
				// if no errors were thrown register the subscription
				this.subscribe(subscription);
				// send an initial response
				client.send(fmtMessage('subscription', data, subscription.uid));
			} catch (err) {
				handleWebsocketException(client, err, 'subscribe');
			}
		}
		if (getMessageType(message) === 'unsubscribe') {
			this.unsubscribe(client, message.uid);
		}
	}
	private async getSinglePayload(
		subscription: Subscription,
		accountability: Accountability | null,
		schema: SchemaOverview,
		event?: WebSocketEvent
	): Promise<Record<string, any>> {
		const service = new ItemsService(subscription.collection, { schema, accountability });
		const metaService = new MetaService({ schema, accountability });
		const query = subscription.query ?? {};
		const id = subscription.item!;

		const result: Record<string, any> = {
			event: event?.action ?? 'init',
		};
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
		event?: WebSocketEvent
	): Promise<Record<string, any>> {
		const service = new ItemsService(subscription.collection, { schema, accountability });
		const metaService = new MetaService({ schema, accountability });
		const query = subscription.query ?? {};
		const result: Record<string, any> = {
			event: event?.action ?? 'init',
		};
		if (!event?.action) {
			result['payload'] = await service.readByQuery(query);
		} else if (event.action === 'create') {
			result['payload'] = await service.readOne(event.key, query);
		} else if (event.action === 'delete') {
			result['payload'] = event.keys;
		} else {
			result['payload'] = await service.readMany(event.keys, query);
		}
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

import type { Accountability, SchemaOverview } from '@directus/types';
import emitter from '../../emitter.js';
import { InvalidPayloadException } from '../../index.js';
import { getMessenger } from '../../messenger.js';
import type { Messenger } from '../../messenger.js';
import { CollectionsService, FieldsService, MetaService } from '../../services/index.js';
import { getSchema } from '../../utils/get-schema.js';
import { getService } from '../../utils/get-service.js';
import { sanitizeQuery } from '../../utils/sanitize-query.js';
import { refreshAccountability } from '../authenticate.js';
import { WebSocketException, handleWebSocketException } from '../exceptions.js';
import type { WebSocketEvent } from '../messages.js';
import { WebSocketSubscribeMessage } from '../messages.js';
import type { Subscription, SubscriptionEvent, WebSocketClient } from '../types.js';
import { fmtMessage, getMessageType } from '../utils/message.js';

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
		this.bindWebSocket();

		// listen to the Redis pub/sub and dispatch
		this.messenger.subscribe('websocket.event', (message: Record<string, any>) => {
			try {
				this.dispatch(message as WebSocketEvent);
			} catch {
				// don't error on an invalid event from the messenger
			}
		});
	}

	/**
	 * Hook into websocket client lifecycle events
	 */
	bindWebSocket() {
		// listen to incoming messages on the connected websockets
		emitter.onAction('websocket.message', ({ client, message }) => {
			if (!['subscribe', 'unsubscribe'].includes(getMessageType(message))) return;

			try {
				this.onMessage(client, WebSocketSubscribeMessage.parse(message));
			} catch (error) {
				handleWebSocketException(client, error, 'subscribe');
			}
		});

		// unsubscribe when a connection drops
		emitter.onAction('websocket.error', ({ client }) => this.unsubscribe(client));
		emitter.onAction('websocket.close', ({ client }) => this.unsubscribe(client));
	}

	/**
	 * Register a subscription
	 * @param subscription
	 */
	subscribe(subscription: Subscription) {
		const { collection } = subscription;

		if ('item' in subscription && ['directus_fields', 'directus_relations'].includes(collection)) {
			throw new InvalidPayloadException(`Cannot subscribe to a specific item in the ${collection} collection.`);
		}

		if (!this.subscriptions[collection]) {
			this.subscriptions[collection] = new Set();
		}

		this.subscriptions[collection]?.add(subscription);
	}

	/**
	 * Remove a subscription
	 * @param subscription
	 */
	unsubscribe(client: WebSocketClient, uid?: string | number) {
		if (uid !== undefined) {
			const subscription = this.getSubscription(client, String(uid));

			if (subscription) {
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
		const subscriptions = this.subscriptions[event.collection];
		if (!subscriptions || subscriptions.size === 0) return;
		const schema = await getSchema();

		for (const subscription of subscriptions) {
			const { client } = subscription;

			if (subscription.event !== undefined && event.action !== subscription.event) {
				continue; // skip filtered events
			}

			try {
				client.accountability = await refreshAccountability(client.accountability);

				const result =
					'item' in subscription
						? await this.getSinglePayload(subscription, client.accountability, schema, event)
						: await this.getMultiPayload(subscription, client.accountability, schema, event);

				if (Array.isArray(result?.['data']) && result?.['data']?.length === 0) return;

				client.send(fmtMessage('subscription', result, subscription.uid));
			} catch (err) {
				handleWebSocketException(client, err, 'subscribe');
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

				const subscription: Subscription = {
					client,
					collection,
				};

				if ('event' in message) {
					subscription.event = message.event as SubscriptionEvent;
				}

				if ('query' in message) {
					subscription.query = sanitizeQuery(message.query!, accountability);
				}

				if ('item' in message) subscription.item = String(message.item);

				if ('uid' in message) {
					subscription.uid = String(message.uid);
					// remove the subscription if it already exists
					this.unsubscribe(client, subscription.uid);
				}

				let data: Record<string, any>;

				if (subscription.event === undefined) {
					data =
						'item' in subscription
							? await this.getSinglePayload(subscription, accountability, schema)
							: await this.getMultiPayload(subscription, accountability, schema);
				} else {
					data = { event: 'init' };
				}

				// if no errors were thrown register the subscription
				this.subscribe(subscription);

				// send an initial response
				client.send(fmtMessage('subscription', data, subscription.uid));
			} catch (err) {
				handleWebSocketException(client, err, 'subscribe');
			}
		}

		if (getMessageType(message) === 'unsubscribe') {
			try {
				this.unsubscribe(client, message.uid);

				client.send(fmtMessage('subscription', { event: 'unsubscribe' }, message.uid));
			} catch (err) {
				handleWebSocketException(client, err, 'unsubscribe');
			}
		}
	}

	private async getSinglePayload(
		subscription: Subscription,
		accountability: Accountability | null,
		schema: SchemaOverview,
		event?: WebSocketEvent
	): Promise<Record<string, any>> {
		const metaService = new MetaService({ schema, accountability });
		const query = subscription.query ?? {};
		const id = subscription.item!;

		const result: Record<string, any> = {
			event: event?.action ?? 'init',
		};

		if (subscription.collection === 'directus_collections') {
			const service = new CollectionsService({ schema, accountability });
			result['data'] = await service.readOne(String(id));
		} else {
			const service = getService(subscription.collection, { schema, accountability });
			result['data'] = await service.readOne(id, query);
		}

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
		const metaService = new MetaService({ schema, accountability });

		const result: Record<string, any> = {
			event: event?.action ?? 'init',
		};

		switch (subscription.collection) {
			case 'directus_collections':
				result['data'] = await this.getCollectionPayload(accountability, schema, event);
				break;
			case 'directus_fields':
				result['data'] = await this.getFieldsPayload(accountability, schema, event);
				break;
			case 'directus_relations':
				result['data'] = event?.payload;
				break;
			default:
				result['data'] = await this.getItemsPayload(subscription, accountability, schema, event);
				break;
		}

		const query = subscription.query ?? {};

		if ('meta' in query) {
			result['meta'] = await metaService.getMetaForQuery(subscription.collection, query);
		}

		return result;
	}

	private async getCollectionPayload(
		accountability: Accountability | null,
		schema: SchemaOverview,
		event?: WebSocketEvent
	) {
		const service = new CollectionsService({ schema, accountability });

		if (!event?.action) {
			return await service.readByQuery();
		} else if (event.action === 'create') {
			return await service.readMany([String(event.key)]);
		} else if (event.action === 'delete') {
			return event.keys;
		} else {
			return await service.readMany(event.keys.map((key: any) => String(key)));
		}
	}

	private async getFieldsPayload(
		accountability: Accountability | null,
		schema: SchemaOverview,
		event?: WebSocketEvent
	) {
		const service = new FieldsService({ schema, accountability });

		if (!event?.action) {
			return await service.readAll();
		} else if (event.action === 'delete') {
			return event.keys;
		} else {
			return await service.readOne(event.payload?.['collection'], event.payload?.['field']);
		}
	}

	private async getItemsPayload(
		subscription: Subscription,
		accountability: Accountability | null,
		schema: SchemaOverview,
		event?: WebSocketEvent
	) {
		const query = subscription.query ?? {};
		const service = getService(subscription.collection, { schema, accountability });

		if (!event?.action) {
			return await service.readByQuery(query);
		} else if (event.action === 'create') {
			return await service.readMany([event.key], query);
		} else if (event.action === 'delete') {
			return event.keys;
		} else {
			return await service.readMany(event.keys, query);
		}
	}

	private getSubscription(client: WebSocketClient, uid: string | number) {
		for (const userSubscriptions of Object.values(this.subscriptions)) {
			for (const subscription of userSubscriptions) {
				if (subscription.client === client && subscription.uid === uid) {
					return subscription;
				}
			}
		}

		return undefined;
	}
}

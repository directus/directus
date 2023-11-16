import emitter from '../../emitter.js';
import { InvalidPayloadError } from '@directus/errors';
import type { Messenger } from '../../messenger.js';
import { getMessenger } from '../../messenger.js';
import { getSchema } from '../../utils/get-schema.js';
import { sanitizeQuery } from '../../utils/sanitize-query.js';
import { refreshAccountability } from '../authenticate.js';
import { WebSocketError, handleWebSocketError } from '../errors.js';
import type { WebSocketEvent } from '../messages.js';
import { WebSocketSubscribeMessage } from '../messages.js';
import type { Subscription, SubscriptionEvent, WebSocketClient } from '../types.js';
import { fmtMessage, getMessageType } from '../utils/message.js';
import { getPayload } from '../utils/items.js';

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
				handleWebSocketError(client, error, 'subscribe');
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
			throw new InvalidPayloadError({ reason: `Cannot subscribe to a specific item in the ${collection} collection.` });
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

			if ('item' in subscription) {
				if ('keys' in event && !event.keys.includes(subscription.item)) continue;
				if ('key' in event && event.key !== subscription.item) continue;
			}

			try {
				client.accountability = await refreshAccountability(client.accountability);

				const result = await getPayload(subscription, client.accountability, schema, event);

				if (Array.isArray(result?.['data']) && result?.['data']?.length === 0) continue;

				client.send(fmtMessage('subscription', result, subscription.uid));
			} catch (err) {
				handleWebSocketError(client, err, 'subscribe');
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
					throw new WebSocketError(
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

				const data =
					subscription.event === undefined ? await getPayload(subscription, accountability, schema) : { event: 'init' };

				// if no errors were thrown register the subscription
				this.subscribe(subscription);

				// send an initial response
				client.send(fmtMessage('subscription', data, subscription.uid));
			} catch (err) {
				handleWebSocketError(client, err, 'subscribe');
			}
		}

		if (getMessageType(message) === 'unsubscribe') {
			try {
				this.unsubscribe(client, message.uid);

				client.send(fmtMessage('subscription', { event: 'unsubscribe' }, message.uid));
			} catch (err) {
				handleWebSocketError(client, err, 'unsubscribe');
			}
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

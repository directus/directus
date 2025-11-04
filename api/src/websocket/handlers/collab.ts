import { type Bus } from '@directus/memory';
import { useBus } from '../../bus/index.js';
import emitter from '../../emitter.js';
import { handleWebSocketError } from '../errors.js';
import { WebSocketCollabMessage } from '../messages.js';
import type { CollabRoom, Subscription, WebSocketClient } from '../types.js';
import { getMessageType } from '../utils/message.js';
import { createHash } from 'crypto';
import { capitalize } from 'lodash-es';

type JoinMessage = Extract<WebSocketCollabMessage, { action: 'join' }>;
type LeaveMessage = Extract<WebSocketCollabMessage, { action: 'leave' }>;
type SaveMessage = Extract<WebSocketCollabMessage, { action: 'save' }>;
type UpdateMessage = Extract<WebSocketCollabMessage, { action: 'update' }>;
type FocusMessage = Extract<WebSocketCollabMessage, { action: 'focus' }>;

/**
 * Handler responsible for subscriptions
 */
export class SubscribeHandler {
	// storage of subscriptions per collection
	rooms: Record<string, CollabRoom>;
	/**
	 * Initialize the handler
	 */
	constructor() {
		this.rooms = {};
		this.bindWebSocket();
	}

	/**
	 * Hook into websocket client lifecycle events
	 */
	bindWebSocket() {
		// listen to incoming messages on the connected websockets
		emitter.onAction('websocket.message', ({ client, message }) => {
			if (getMessageType(message) !== 'collab') return;

			try {
				const validMessage = WebSocketCollabMessage.parse(message);
				this[`on${capitalize(validMessage.action)}`](client, message);
			} catch (error) {
				handleWebSocketError(client, error, 'subscribe');
			}
		});

		// unsubscribe when a connection drops
		emitter.onAction('websocket.error', ({ client }) => this.onLeave(client));
		emitter.onAction('websocket.close', ({ client }) => this.onLeave(client));
	}

	onJoin(client: WebSocketClient, message: JoinMessage) {
		try {
			const uid = getRoomHash(message.collection, message.item, message.version);

			if (!(uid in this.rooms)) {
				this.rooms[uid] = {
					uid,
					changes: message.initialChanges ?? {},
					clients: [],
					collection: message.collection,
					item: message.item,
					version: message.version,
				};
			}

			const room = this.rooms[uid]!;

			if (room.clients.find((c) => c.uid === client.uid)) room.clients.push(client);
		} catch (err) {
			handleWebSocketError(client, err, 'join');
		}
	}

	onLeave(client: WebSocketClient, message?: LeaveMessage) {
		try {
			let rooms: CollabRoom[] = [];

			if (message) {
				const room = this.rooms[message.room];
				if (room) rooms = [room];
			} else {
				rooms = Object.values(this.rooms);
			}

			for (const room of rooms) {
				room.clients = room.clients.filter((c) => c.uid === client.uid);
			}
		} catch (err) {
			handleWebSocketError(client, err, 'leave');
		}
	}

	onSave(client: WebSocketClient, message: SaveMessage) {}

	onUpdate(client: WebSocketClient, message: UpdateMessage) {}

	onFocus(client: WebSocketClient, message: FocusMessage) {}

	getRoom(message: WebSocketCollabMessage) {
		if (message.action === 'join') {
			return this.rooms[getRoomHash(message.collection, message.item, message.version)];
		}

		return this.rooms[message.room];
	}
}

function getRoomHash(collection: string, item: string | number, version?: string) {
	return createHash('sha256').update([collection, item, version].join('-')).digest('hex');
}

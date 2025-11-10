import { COLLAB, WebSocketCollabMessage, type WebSocketClient } from '@directus/types';
import { capitalize } from 'lodash-es';
import emitter from '../../../emitter.js';
import { handleWebSocketError } from '../../errors.js';
import { getMessageType } from '../../utils/message.js';
import { CollabRooms } from './room.js';
import type { FocusMessage, JoinMessage, LeaveMessage, SaveMessage, UpdateMessage } from './types.js';

/**
 * Handler responsible for subscriptions
 */
export class CollabHandler {
	// storage of subscriptions per collection
	rooms: CollabRooms;
	/**
	 * Initialize the handler
	 */
	constructor() {
		this.rooms = new CollabRooms();
		this.bindWebSocket();
	}

	/**
	 * Hook into websocket client lifecycle events
	 */
	bindWebSocket() {
		// listen to incoming messages on the connected websockets
		emitter.onAction('websocket.message', async ({ client, message }) => {
			if (getMessageType(message) !== COLLAB) return;

			try {
				const validMessage = WebSocketCollabMessage.parse(message);
				await this[`on${capitalize(validMessage.action)}`](client, message);
			} catch (error) {
				handleWebSocketError(client, error, 'subscribe');
			}
		});

		// unsubscribe when a connection drops
		emitter.onAction('websocket.error', ({ client }) => this.onLeave(client));
		emitter.onAction('websocket.close', ({ client }) => this.onLeave(client));
	}

	async onJoin(client: WebSocketClient, message: JoinMessage) {
		try {
			const room = await this.rooms.createRoom(
				message.collection,
				message.item,
				message.version ?? null,
				message.initialChanges,
			);

			await room.join(client);
		} catch (err) {
			handleWebSocketError(client, err, 'join');
		}
	}

	onLeave(client: WebSocketClient, message?: LeaveMessage) {
		try {
			if (message) {
				const room = this.rooms.getRoom(message.room);

				if (!room) return;

				room.leave(client);
			} else {
				const rooms = this.rooms.getClientRooms(client);

				for (const room of rooms) {
					room.leave(client);
				}
			}

			this.rooms.cleanupRooms();
		} catch (err) {
			handleWebSocketError(client, err, 'leave');
		}
	}

	onSave(client: WebSocketClient, message: SaveMessage) {
		try {
			const room = this.rooms.getRoom(message.room);

			if (!room) return;

			room.save(client);
		} catch (err) {
			handleWebSocketError(client, err, 'save');
		}
	}

	onUpdate(client: WebSocketClient, message: UpdateMessage) {
		try {
			const room = this.rooms.getRoom(message.room);

			if (!room) return;

			if ('changes' in message) {
				room.update(message.field, message.changes);
			} else {
				room.unset(message.field);
			}
		} catch (err) {
			handleWebSocketError(client, err, 'update');
		}
	}

	onFocus(client: WebSocketClient, message: FocusMessage) {
		try {
			const room = this.rooms.getRoom(message.room);

			if (!room) return;

			room.focus(client, message.field);
		} catch (err) {
			handleWebSocketError(client, err, 'focus');
		}
	}
}

import { COLLAB, WebSocketCollabMessage, type WebSocketClient } from '@directus/types';
import { capitalize } from 'lodash-es';
import emitter from '../../../emitter.js';
import { handleWebSocketError } from '../../errors.js';
import { getMessageType } from '../../utils/message.js';
import { CollabRooms } from './room.js';
import type { FocusMessage, JoinMessage, LeaveMessage, SaveMessage, UpdateMessage } from './types.js';
import { fetchAllowedCollections } from '../../../permissions/modules/fetch-allowed-collections/fetch-allowed-collections.js';
import getDatabase from '../../../database/index.js';
import { getSchema } from '../../../utils/get-schema.js';
import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import { hasFieldPermision } from './field-permissions.js';

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
			const allowedCollections = await fetchAllowedCollections(
				{ accountability: client.accountability!, action: 'read' },
				{ knex: getDatabase(), schema: await getSchema() },
			);

			if (!allowedCollections.includes(message.collection))
				throw new InvalidPayloadError({
					reason: `No permission to access collection ${message.collection} or collection does not exist`,
				});

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

				if (!room)
					throw new InvalidPayloadError({
						reason: `No access to room ${message.room} or room does not exist`,
					});

				if (!room.hasClient(client))
					throw new InvalidPayloadError({
						reason: `Not connected to room ${message.room}`,
					});

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

			if (!room)
				throw new InvalidPayloadError({
					reason: `No access to room ${message.room} or room does not exist`,
				});

			if (!room.hasClient(client))
				throw new InvalidPayloadError({
					reason: `Not connected to room ${message.room}`,
				});

			room.save(client);
		} catch (err) {
			handleWebSocketError(client, err, 'save');
		}
	}

	async onUpdate(client: WebSocketClient, message: UpdateMessage) {
		try {
			const room = this.rooms.getRoom(message.room);

			if (!room)
				throw new InvalidPayloadError({
					reason: `No access to room ${message.room} or room does not exist`,
				});

			if (!room.hasClient(client))
				throw new InvalidPayloadError({
					reason: `Not connected to room ${message.room}`,
				});

			if ((await hasFieldPermision(client.accountability!, room.collection, message.field)) === false)
				throw new InvalidPayloadError({
					reason: `No permission to update field ${message.field} or field does not exist`,
				});

			if ('changes' in message) {
				room.update(message.field, message.changes);
			} else {
				room.unset(message.field);
			}
		} catch (err) {
			handleWebSocketError(client, err, 'update');
		}
	}

	async onFocus(client: WebSocketClient, message: FocusMessage) {
		try {
			const room = this.rooms.getRoom(message.room);

			if (!room)
				throw new InvalidPayloadError({
					reason: `No access to room ${message.room} or room does not exist`,
				});

			if (!room.hasClient(client))
				throw new InvalidPayloadError({
					reason: `Not connected to room ${message.room}`,
				});

			if (message.field && (await hasFieldPermision(client.accountability!, room.collection, message.field)) === false)
				throw new InvalidPayloadError({
					reason: `No permission to focus on field ${message.field} or field does not exist`,
				});

			room.focus(client, message.field);
		} catch (err) {
			handleWebSocketError(client, err, 'focus');
		}
	}
}

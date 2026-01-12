import { WS_TYPE, type WebSocketClient } from '@directus/types';
import { upperFirst } from 'lodash-es';
import emitter from '../../../emitter.js';
import { handleWebSocketError } from '../../errors.js';
import { getMessageType } from '../../utils/message.js';
import { CollabRooms } from './room.js';
import type { FocusMessage, JoinMessage, LeaveMessage, SaveMessage, UpdateAllMessage, UpdateMessage } from './types.js';
import { fetchAllowedCollections } from '../../../permissions/modules/fetch-allowed-collections/fetch-allowed-collections.js';
import getDatabase from '../../../database/index.js';
import { getSchema } from '../../../utils/get-schema.js';
import { InvalidPayloadError } from '@directus/errors';
import { Messenger } from './messenger.js';
import { ClientMessage } from '@directus/types/collab';
import { getService } from '../../../utils/get-service.js';
import { isFieldAllowed } from '../../../utils/is-field-allowed.js';

/**
 * Handler responsible for subscriptions
 */
export class CollabHandler {
	rooms: CollabRooms;
	messenger = new Messenger();

	/**
	 * Initialize the handler
	 */
	constructor() {
		this.rooms = new CollabRooms(this.messenger);
		this.bindWebSocket();
	}

	/**
	 * Hook into websocket client lifecycle events
	 */
	bindWebSocket() {
		// listen to incoming messages on the connected websockets
		emitter.onAction('websocket.message', async ({ client, message }) => {
			if (getMessageType(message) !== WS_TYPE.COLLAB) return;

			try {
				const validMessage = ClientMessage.parse(message);
				await this[`on${upperFirst(validMessage.action)}`](client, message);
			} catch (error) {
				handleWebSocketError(client, error, WS_TYPE.COLLAB);
			}
		});

		// unsubscribe when a connection drops
		emitter.onAction('websocket.error', ({ client }) => this.onLeave(client));
		emitter.onAction('websocket.close', ({ client }) => this.onLeave(client));
	}

	/**
	 * Join a collaboration room
	 */
	async onJoin(client: WebSocketClient, message: JoinMessage) {
		try {
			if (client.accountability?.share) {
				throw new InvalidPayloadError({
					reason: 'Collaboration is not supported for shares',
				});
			}

			this.messenger.addClient(client);
			const schema = await getSchema();

			const allowedCollections = await fetchAllowedCollections(
				{ accountability: client.accountability!, action: 'read' },
				{ knex: getDatabase(), schema },
			);

			if (!allowedCollections.includes(message.collection))
				throw new InvalidPayloadError({
					reason: `No permission to access collection ${message.collection} or collection does not exist`,
				});

			if (!message.item && !schema.collections[message.collection]?.singleton)
				throw new InvalidPayloadError({
					reason: `Item id has to be provided for non singleton collections`,
				});

			try {
				const service = getService(message.collection, {
					schema,
					accountability: client.accountability,
				});

				if (schema.collections[message.collection]?.singleton) {
					await service.readSingleton({});
				} else {
					await service.readOne(message.item!);
				}
			} catch {
				throw new InvalidPayloadError({
					reason: `No permission to access item or it does not exist`,
				});
			}

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

	/**
	 * Leave a collaboration room
	 */
	async onLeave(client: WebSocketClient, message?: LeaveMessage) {
		try {
			const roomIds: string[] = [];

			if (message) {
				const room = await this.rooms.getRoom(message.room);

				if (!room)
					throw new InvalidPayloadError({
						reason: `No access to room ${message.room} or room does not exist`,
					});

				if (!room.hasClient(client.uid))
					throw new InvalidPayloadError({
						reason: `Not connected to room ${message.room}`,
					});

				room.leave(client);
				roomIds.push(room.uid);
			} else {
				const rooms = await this.rooms.getClientRooms(client);

				for (const room of rooms) {
					room.leave(client);
					roomIds.push(room.uid);
				}
			}

			if (roomIds.length > 0) {
				await this.rooms.cleanupRooms(roomIds);
			}
		} catch (err) {
			handleWebSocketError(client, err, 'leave');
		}
	}

	/**
	 * Save the room state
	 */
	async onSave(client: WebSocketClient, message: SaveMessage) {
		try {
			const room = await this.rooms.getRoom(message.room);

			if (!room)
				throw new InvalidPayloadError({
					reason: `No access to room ${message.room} or room does not exist`,
				});

			if (!room.hasClient(client.uid))
				throw new InvalidPayloadError({
					reason: `Not connected to room ${message.room}`,
				});

			room.save(client);
		} catch (err) {
			handleWebSocketError(client, err, 'save');
		}
	}

	/**
	 * Update a field value
	 */
	async onUpdate(client: WebSocketClient, message: UpdateMessage) {
		try {
			const room = await this.rooms.getRoom(message.room);

			if (!room)
				throw new InvalidPayloadError({
					reason: `No access to room ${message.room} or room does not exist`,
				});

			if (!room.hasClient(client.uid))
				throw new InvalidPayloadError({
					reason: `Not connected to room ${message.room}`,
				});

			const { myFocus, focusHolder } = await room.checkFocus(client.uid, message.field);

			if (myFocus && myFocus !== message.field) {
				throw new InvalidPayloadError({
					reason: `Cannot update field ${message.field} while focused on ${myFocus}`,
				});
			}

			if (focusHolder) {
				throw new InvalidPayloadError({
					reason: `Field ${message.field} is being edited by another user`,
				});
			}

			const allowedFields = await room.verifyPermissions(client, room.collection, room.item, 'update');

			if (!isFieldAllowed(allowedFields, message.field))
				throw new InvalidPayloadError({
					reason: `No permission to update field ${message.field} or field does not exist`,
				});

			if ('changes' in message) {
				room.update(client, { [message.field]: message.changes });
			} else {
				room.unset(client, message.field);
			}
		} catch (err) {
			handleWebSocketError(client, err, 'update');
		}
	}

	/**
	 * Update multiple field values
	 */
	async onUpdateAll(client: WebSocketClient, message: UpdateAllMessage) {
		try {
			const room = await this.rooms.getRoom(message.room);

			if (!room)
				throw new InvalidPayloadError({
					reason: `No access to room ${message.room} or room does not exist`,
				});

			if (!room.hasClient(client.uid))
				throw new InvalidPayloadError({
					reason: `Not connected to room ${message.room}`,
				});

			const collection = await room.getCollection();
			const allowedFields = await room.verifyPermissions(client, collection, room.item, 'update');

			for (const key of Object.keys(message.changes ?? {})) {
				if (!isFieldAllowed(allowedFields, key))
					throw new InvalidPayloadError({
						reason: `No permission to update field ${key} or field does not exist`,
					});
			}

			if (message.changes) {
				room.update(client, message.changes);
			}
		} catch (err) {
			handleWebSocketError(client, err, 'update');
		}
	}

	/**
	 * Update focus state
	 */
	async onFocus(client: WebSocketClient, message: FocusMessage) {
		try {
			const room = await this.rooms.getRoom(message.room);

			if (!room)
				throw new InvalidPayloadError({
					reason: `No access to room ${message.room} or room does not exist`,
				});

			if (!room.hasClient(client.uid))
				throw new InvalidPayloadError({
					reason: `Not connected to room ${message.room}`,
				});

			if (message.field) {
				const allowedFields = await room.verifyPermissions(client, room.collection, room.item, 'read');

				if (!isFieldAllowed(allowedFields, message.field)) {
					throw new InvalidPayloadError({
						reason: `No permission to focus on field ${message.field} or field does not exist`,
					});
				}
			}

			room.focus(client, message.field);
		} catch (err) {
			handleWebSocketError(client, err, 'focus');
		}
	}
}

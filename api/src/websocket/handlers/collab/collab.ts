import { InvalidPayloadError } from '@directus/errors';
import { type WebSocketClient, WS_TYPE } from '@directus/types';
import { ClientMessage } from '@directus/types/collab';
import { difference, upperFirst } from 'lodash-es';
import getDatabase from '../../../database/index.js';
import emitter from '../../../emitter.js';
import { useLogger } from '../../../logger/index.js';
import { fetchAllowedCollections } from '../../../permissions/modules/fetch-allowed-collections/fetch-allowed-collections.js';
import { getSchema } from '../../../utils/get-schema.js';
import { getService } from '../../../utils/get-service.js';
import { isFieldAllowed } from '../../../utils/is-field-allowed.js';
import { scheduleSynchronizedJob } from '../../../utils/schedule.js';
import { handleWebSocketError } from '../../errors.js';
import { getMessageType } from '../../utils/message.js';
import { Messenger } from './messenger.js';
import { CollabRooms } from './room.js';
import type { FocusMessage, JoinMessage, LeaveMessage, UpdateAllMessage, UpdateMessage } from './types.js';
import { verifyPermissions } from './verify-permissions.js';

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

		scheduleSynchronizedJob('collab', `*/1 * * * *`, async () => {
			const { inactive, active } = await this.messenger.removeInvalidClients();

			const roomClients = (await this.rooms.getAllClients()).map((client) => client.uid);
			const invalidClients = difference(roomClients, active);

			for (const client of [...inactive, ...invalidClients]) {
				const rooms = await this.rooms.getClientRooms(client);

				useLogger().info(`[Collab] Removing inactive client ${client}`);

				for (const room of rooms) {
					await room.leave(client);
				}
			}

			await this.rooms.cleanupRooms();
		});
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

				room.leave(client.uid);
				roomIds.push(room.uid);
			} else {
				const rooms = await this.rooms.getClientRooms(client.uid);

				for (const room of rooms) {
					room.leave(client.uid);
					roomIds.push(room.uid);
				}
			}
		} catch (err) {
			handleWebSocketError(client, err, 'leave');
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

			let focus = await room.getFocusByUser(client.uid);

			if (!focus) {
				await room.focus(client, message.field);

				focus = await room.getFocusByUser(client.uid);
			}

			// Focus field before update to prevent concurrent overwrite conflicts
			if (!focus || focus !== message.field) {
				throw new InvalidPayloadError({
					reason: `Cannot update field ${message.field} without focusing on it first`,
				});
			}

			const knex = getDatabase();
			const schema = await getSchema();

			const allowedFields = await verifyPermissions(client.accountability, room.collection, room.item, 'update', {
				knex,
				schema,
			});

			if (!isFieldAllowed(allowedFields, message.field))
				throw new InvalidPayloadError({
					reason: `No permission to update field ${message.field} or field does not exist`,
				});

			if (message.changes !== undefined) {
				await room.update(client, { [message.field]: message.changes });
			} else {
				await room.unset(client, message.field);
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
			const knex = getDatabase();
			const schema = await getSchema();

			const allowedFields = await verifyPermissions(client.accountability, collection, room.item, 'update', {
				knex,
				schema,
			});

			for (const key of Object.keys(message.changes ?? {})) {
				if (!isFieldAllowed(allowedFields, key))
					throw new InvalidPayloadError({
						reason: `No permission to update field ${key} or field does not exist`,
					});

				const focus = await room.getFocusByField(key);

				if (focus && focus !== client.uid) {
					delete message.changes?.[key];
				}
			}

			if (message.changes) {
				await room.update(client, message.changes);
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

			if (!(await room.hasClient(client.uid)))
				throw new InvalidPayloadError({
					reason: `Not connected to room ${message.room}`,
				});

			if (message.field) {
				const knex = getDatabase();
				const schema = await getSchema();

				const allowedReadFields = await verifyPermissions(client.accountability, room.collection, room.item, 'read', {
					knex,
					schema,
				});

				const allowedUpdateFields = await verifyPermissions(
					client.accountability,
					room.collection,
					room.item,
					'update',
					{ knex, schema },
				);

				if (!isFieldAllowed(allowedReadFields, message.field) || !isFieldAllowed(allowedUpdateFields, message.field)) {
					throw new InvalidPayloadError({
						reason: `No permission to focus on field ${message.field} or field does not exist`,
					});
				}
			}

			if (!(await room.focus(client, message.field ?? null))) {
				throw new InvalidPayloadError({
					reason: `Field ${message.field} is already focused by another user`,
				});
			}
		} catch (err) {
			handleWebSocketError(client, err, 'focus');
		}
	}
}

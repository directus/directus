import { useEnv } from '@directus/env';
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
import { RoomManager } from './room.js';
import type { FocusMessage, JoinMessage, LeaveMessage, UpdateAllMessage, UpdateMessage } from './types.js';
import { verifyPermissions } from './verify-permissions.js';

const env = useEnv();

const CLUSTER_CLEANUP_CRON = String(env['WEBSOCKETS_COLLAB_CLUSTER_CLEANUP_CRON']);
const LOCAL_CLEANUP_INTERVAL = Number(env['WEBSOCKETS_COLLAB_LOCAL_CLEANUP_INTERVAL']);

/**
 * Handler responsible for subscriptions
 */
export class CollabHandler {
	roomManager: RoomManager;
	messenger = new Messenger();

	/**
	 * Initialize the handler
	 */
	constructor() {
		this.roomManager = new RoomManager(this.messenger);
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

		scheduleSynchronizedJob('collab', CLUSTER_CLEANUP_CRON, async () => {
			const { inactive } = await this.messenger.pruneDeadInstances();

			// Remove clients and close rooms hosted by nodes that are now dead
			for (const roomUid of inactive.rooms) {
				const room = await this.roomManager.getRoom(roomUid);

				if (room) {
					// Remove dead clients globally
					for (const client of inactive.clients) {
						if (await room.hasClient(client)) {
							useLogger().info(`[Collab] Removing dead client ${client} from room ${roomUid}`);
							await room.leave(client);
						}
					}

					// Close room if it was truly abandoned
					if (await room.close()) {
						this.roomManager.removeRoom(room.uid);
					}
				}
			}
		});

		setInterval(async () => {
			// Remove local clients that are no longer in the global registry
			const { active } = await this.messenger.getRegistry();
			const roomClients = (await this.roomManager.getAllClients()).map((client) => client.uid);
			const invalidClients = difference(roomClients, active);

			for (const client of invalidClients) {
				const rooms = await this.roomManager.getClientRooms(client);

				for (const room of rooms) {
					useLogger().info(`[Collab] Removing invalid client ${client} from room ${room.uid}`);
					await room.leave(client);
				}
			}

			await this.roomManager.cleanupRooms();
		}, LOCAL_CLEANUP_INTERVAL);
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

			const room = await this.roomManager.createRoom(
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
			if (message?.room) {
				const room = await this.roomManager.getRoom(message.room);
				if (!room)
					throw new InvalidPayloadError({
						reason: `Room "${message.room}" does not exist`,
					});

				await room.leave(client.uid);
			} else {
				const rooms = await this.roomManager.getClientRooms(client.uid);

				for (const room of rooms) {
					await room.leave(client.uid);
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
			const room = await this.roomManager.getRoom(message.room);

			if (!room)
				throw new InvalidPayloadError({
					reason: `No access to room ${message.room} or room does not exist`,
				});

			if (!(await room.hasClient(client.uid)))
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

			if (
				!isFieldAllowed(allowedFields, message.field) ||
				!schema.collections[room.collection]?.fields[message.field]
			) {
				throw new InvalidPayloadError({
					reason: `No permission to update field ${message.field} or field does not exist`,
				});
			}

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
			const room = await this.roomManager.getRoom(message.room);

			if (!room)
				throw new InvalidPayloadError({
					reason: `No access to room ${message.room} or room does not exist`,
				});

			if (!(await room.hasClient(client.uid)))
				throw new InvalidPayloadError({
					reason: `Not connected to room ${message.room}`,
				});

			const collection = room.collection;
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
			const room = await this.roomManager.getRoom(message.room);

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

import { useEnv } from '@directus/env';
import { ForbiddenError, InvalidPayloadError, ServiceUnavailableError } from '@directus/errors';
import { type WebSocketClient, WS_TYPE } from '@directus/types';
import { ClientMessage } from '@directus/types/collab';
import { difference, isEmpty, upperFirst } from 'lodash-es';
import getDatabase from '../../../database/index.js';
import emitter from '../../../emitter.js';
import { useLogger } from '../../../logger/index.js';
import { validateItemAccess } from '../../../permissions/modules/validate-access/lib/validate-item-access.js';
import { SettingsService } from '../../../services/settings.js';
import { getSchema } from '../../../utils/get-schema.js';
import { isFieldAllowed } from '../../../utils/is-field-allowed.js';
import { scheduleSynchronizedJob } from '../../../utils/schedule.js';
import { getMessageType } from '../../utils/message.js';
import { Messenger } from './messenger.js';
import { getRoomHash, RoomManager } from './room.js';
import type {
	DiscardMessage,
	FocusMessage,
	JoinMessage,
	LeaveMessage,
	UpdateAllMessage,
	UpdateMessage,
} from './types.js';
import { validateChanges } from './validate-changes.js';
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
	enabled = false;

	private initialized: Promise<void>;

	/**
	 * Initialize the handler
	 */
	constructor() {
		this.roomManager = new RoomManager(this.messenger);
		this.initialized = this.initialize();
		this.bindWebSocket();
	}

	async initialize(force = false): Promise<void> {
		if (this.initialized && !force) return this.initialized;

		const promise = (async () => {
			try {
				const schema = await getSchema();
				const service = new SettingsService({ schema });
				const settings = await service.readSingleton({ fields: ['collaboration'] });
				this.enabled = settings?.['collaboration'] ?? true;
			} catch (err) {
				useLogger().error(err, '[Collab] Failed to initialize collaboration settings');
			}
		})();

		if (!this.initialized) {
			this.initialized = promise;
		}

		return promise;
	}

	bindWebSocket() {
		/**
		 * Listen for all system events via bus to ensure once-only delivery and consistency across instances
		 *
		 * Local updates:
		 * Service -> Emitter -> Hooks -> Bus -> CollabHandler -> Room -> Local Clients
		 *
		 * Remote updates:
		 * Service (Node B) -> Emitter (Node B) -> Hooks (Node B) -> Bus -> CollabHandler (Node A) -> Room (Node A) -> Remote Clients
		 */
		this.messenger.messenger.subscribe('websocket.event', async (event: any) => {
			try {
				if (event.collection === 'directus_settings' && event.action === 'update') {
					useLogger().debug(`[Collab] [Node ${this.messenger.uid}] Settings update via bus, triggering handler`);

					// Non-blocking initialization to avoid bus congestion
					this.initialize(true)
						.then(() => {
							if (!this.enabled) {
								try {
									useLogger().debug(
										`[Collab] [Node ${this.messenger.uid}] Collaboration disabled, terminating all rooms`,
									);

									this.roomManager.terminateAll();
								} catch (err) {
									useLogger().error(err, '[Collab] Collaboration disabling terminateAll failed');
								}
							}
						})
						.catch((err) => {
							useLogger().error(err, '[Collab] Collaboration re-initialization failed');
						});

					return;
				}

				if (event.action === 'update' || event.action === 'delete') {
					let keys: (string | number)[] = [];

					if (Array.isArray(event.keys)) {
						keys = event.keys;
					} else if (event.key) {
						keys = [event.key];
					} else if (event.payload && event.action === 'delete') {
						keys = Array.isArray(event.payload) ? event.payload : [event.payload];
					}

					event.keys = keys;

					if (event.collection === 'directus_versions') {
						for (const room of Object.values(this.roomManager.rooms)) {
							if (room.version && keys.some((key) => String(key) === room.version)) {
								useLogger().debug(
									`[Collab] [Node ${this.messenger.uid}] Forwarding distributed version ${event.action} to local room ${room.uid}`,
								);

								if (event.action === 'delete') {
									await room.onDeleteHandler(event);
								} else {
									await room.onUpdateHandler(event);
								}
							}
						}

						return;
					}

					// Ensure singleton rooms (null) are notified of changes
					const keysToCheck = Array.from(new Set([...keys, null]));

					for (const key of keysToCheck) {
						const roomUid = getRoomHash(event.collection, key, null);
						const room = this.roomManager.rooms[roomUid];

						if (room) {
							useLogger().debug(
								`[Collab] [Node ${this.messenger.uid}] Forwarding distributed ${event.action} to local room ${roomUid}`,
							);

							const singleKeyedEvent = { ...event, keys: key === null ? keys : [key] };

							if (event.action === 'delete') {
								await room.onDeleteHandler(singleKeyedEvent);
							} else {
								await room.onUpdateHandler(singleKeyedEvent);
							}
						}
					}
				}
			} catch (err) {
				useLogger().error(err, `[Collab] Bus message processing failed for ${event.collection}/${event.action}`);
			}
		});

		emitter.onAction('websocket.connect', ({ client }) => {
			this.messenger.addClient(client);
		});

		// listen to incoming messages on the connected websockets
		emitter.onAction('websocket.message', async ({ client, message }) => {
			if (getMessageType(message) !== WS_TYPE.COLLAB) return;

			const { data, error } = ClientMessage.safeParse(message);

			if (!data) {
				this.messenger.handleError(
					client.uid,
					new InvalidPayloadError({
						reason: `Couldn't parse payload. ${error.message}`,
					}),
				);

				return;
			}

			try {
				await this[`on${upperFirst(data.action)}`](client, message);
			} catch (error) {
				this.messenger.handleError(client.uid, error, data?.action);
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
			try {
				// Remove local clients that are no longer in the global registry
				const clients = await this.messenger.getGlobalClients();
				const roomClients = (await this.roomManager.getAllRoomClients()).map((client) => client.uid);
				const invalidClients = difference(roomClients, clients);

				for (const client of invalidClients) {
					const rooms = await this.roomManager.getClientRooms(client);

					for (const room of rooms) {
						useLogger().info(`[Collab] Removing invalid client ${client} from room ${room.uid}`);
						await room.leave(client);
					}
				}

				await this.roomManager.cleanupRooms();
			} catch (err) {
				useLogger().error(err, '[Collab] Local cleanup interval failed');
			}
		}, LOCAL_CLEANUP_INTERVAL);
	}

	/**
	 * Ensure collaboration is enabled and initialized
	 */
	async ensureEnabled() {
		await this.initialized;

		if (!this.enabled) {
			throw new ServiceUnavailableError({
				reason: 'Collaboration is disabled',
				service: 'collab',
			});
		}
	}

	/**
	 * Join a collaboration room
	 */
	async onJoin(client: WebSocketClient, message: JoinMessage) {
		try {
			await this.ensureEnabled();
		} catch (error) {
			if (error instanceof ServiceUnavailableError && error.message.includes('Collaboration is disabled')) {
				this.messenger.handleError(client.uid, error, message.action);
				this.messenger.terminateClient(client.uid);
				return;
			}

			throw error;
		}

		if (client.accountability?.share) {
			throw new ForbiddenError({
				reason: 'Collaboration is not supported for shares',
			});
		}

		const schema = await getSchema();
		const db = getDatabase();

		if (!message.item && !schema.collections[message.collection]?.singleton)
			throw new InvalidPayloadError({
				reason: `Item id has to be provided for non singleton collections`,
			});

		try {
			const { accessAllowed } = await validateItemAccess(
				{
					accountability: client.accountability!,
					action: 'read',
					collection: message.collection,
					primaryKeys: schema.collections[message.collection]?.singleton ? [] : [message.item!],
				},
				{ knex: db, schema },
			);

			if (!accessAllowed) throw new ForbiddenError();

			if (message.version) {
				const { accessAllowed: versionAccessAllowed } = await validateItemAccess(
					{
						accountability: client.accountability!,
						action: 'read',
						collection: 'directus_versions',
						primaryKeys: [message.version],
					},
					{ knex: db, schema },
				);

				if (!versionAccessAllowed) throw new ForbiddenError();
			}
		} catch {
			throw new ForbiddenError({
				reason: `No permission to access item or it does not exist`,
			});
		}

		if (message.initialChanges) {
			await validateChanges(message.initialChanges, message.collection, message.item, {
				knex: db,
				schema,
				accountability: client.accountability,
			});
		}

		const room = await this.roomManager.createRoom(
			message.collection,
			message.item,
			message.version ?? null,
			message.initialChanges,
		);

		await room.join(client, message.color);
	}

	/**
	 * Leave a collaboration room
	 */
	async onLeave(client: WebSocketClient, message?: LeaveMessage) {
		if (message?.room) {
			const room = await this.roomManager.getRoom(message.room);

			if (!room) {
				throw new ForbiddenError({
					reason: `No access to room "${message.room}" or it does not exist`,
				});
			}

			await room.leave(client.uid);
		} else {
			const rooms = await this.roomManager.getClientRooms(client.uid);

			for (const room of rooms) {
				await room.leave(client.uid);
			}
		}
	}

	/**
	 * Update a field value
	 */
	async onUpdate(client: WebSocketClient, message: UpdateMessage) {
		await this.ensureEnabled();

		const knex = getDatabase();
		const schema = await getSchema();

		const room = await this.roomManager.getRoom(message.room);

		if (!room || !(await room.hasClient(client.uid))) {
			throw new ForbiddenError({
				reason: `No access to room ${message.room} or room does not exist`,
			});
		}

		await this.checkFieldsAccess(client, room, message.field, 'update', { knex, schema });

		// Focus field before update to prevent concurrent overwrite conflicts
		let focus = await room.getFocusByUser(client.uid);

		if (focus !== message.field) {
			await room.focus(client, message.field);

			focus = await room.getFocusByUser(client.uid);
		}

		// Focus field before update to prevent concurrent overwrite conflicts
		if (!focus || focus !== message.field) {
			throw new ForbiddenError({
				reason: `Cannot update field ${message.field} without focusing on it first`,
			});
		}

		if (message.changes !== undefined) {
			await validateChanges({ [message.field]: message.changes }, room.collection, room.item, {
				knex,
				schema,
				accountability: client.accountability,
			});

			await room.update(client, { [message.field]: message.changes });
		} else {
			await room.unset(client, message.field);
		}
	}

	/**
	 * Update multiple field values
	 */
	async onUpdateAll(client: WebSocketClient, message: UpdateAllMessage) {
		await this.ensureEnabled();

		if (isEmpty(message.changes)) return;

		const room = await this.roomManager.getRoom(message.room);

		if (!room || !(await room.hasClient(client.uid)))
			throw new ForbiddenError({
				reason: `No access to room ${message.room} or room does not exist`,
			});

		const collection = room.collection;
		const knex = getDatabase();
		const schema = await getSchema();

		const fields = Object.keys(message.changes ?? {});
		await this.checkFieldsAccess(client, room, fields, 'update', { knex, schema });

		for (const key of fields) {
			const focus = await room.getFocusByField(key);

			if (focus && focus !== client.uid) {
				delete message.changes?.[key];
			}
		}

		if (message.changes) {
			await validateChanges(message.changes, collection, room.item, {
				knex,
				schema,
				accountability: client.accountability,
			});

			await room.update(client, message.changes);
		}
	}

	/**
	 * Update focus state
	 */
	async onFocus(client: WebSocketClient, message: FocusMessage) {
		await this.ensureEnabled();

		const room = await this.roomManager.getRoom(message.room);

		if (!room || !(await room.hasClient(client.uid)))
			throw new ForbiddenError({
				reason: `No access to room ${message.room} or room does not exist`,
			});

		if (message.field) {
			await this.checkFieldsAccess(client, room, message.field, 'focus on');
		}

		if (!(await room.focus(client, message.field ?? null))) {
			throw new ForbiddenError({
				reason: `Field ${message.field} is already focused by another user`,
			});
		}
	}

	/**
	 * Discard specified changes in the room
	 */
	async onDiscard(client: WebSocketClient, message: DiscardMessage) {
		await this.ensureEnabled();

		const room = await this.roomManager.getRoom(message.room);

		if (!room || !(await room.hasClient(client.uid))) {
			throw new ForbiddenError({
				reason: `No access to room ${message.room} or room does not exist`,
			});
		}

		await room.discard(client.accountability!);
	}

	/**
	 * Verify field access for both READ and UPDATE permissions
	 */
	private async checkFieldsAccess(
		client: WebSocketClient,
		room: any,
		fields: string | string[],
		errorAction: string,
		options: { knex?: any; schema?: any } = {},
	): Promise<void> {
		const knex = options.knex ?? getDatabase();
		const schema = options.schema ?? (await getSchema());

		const [allowedReadFields, allowedUpdateFields] = await Promise.all([
			verifyPermissions(client.accountability, room.collection, room.item, 'read', { knex, schema }),
			verifyPermissions(client.accountability, room.collection, room.item, 'update', { knex, schema }),
		]);

		const fieldsArray = Array.isArray(fields) ? fields : [fields];

		for (const field of fieldsArray) {
			const fieldExists = !!schema.collections[room.collection]?.fields[field];

			if (
				!fieldExists ||
				(allowedReadFields !== null && !isFieldAllowed(allowedReadFields, field)) ||
				(allowedUpdateFields !== null && !isFieldAllowed(allowedUpdateFields, field))
			) {
				throw new ForbiddenError({
					reason: `No permission to ${errorAction} field ${field} or field does not exist`,
				});
			}
		}
	}
}

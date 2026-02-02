import { useEnv } from '@directus/env';
import { ForbiddenError, InvalidPayloadError, ServiceUnavailableError } from '@directus/errors';
import { type WebSocketClient, WS_TYPE } from '@directus/types';
import { ClientMessage } from '@directus/types/collab';
import { toArray } from '@directus/utils';
import { difference, intersection, isEmpty, upperFirst } from 'lodash-es';
import getDatabase from '../../database/index.js';
import emitter from '../../emitter.js';
import { useLogger } from '../../logger/index.js';
import { validateItemAccess } from '../../permissions/modules/validate-access/lib/validate-item-access.js';
import { SettingsService } from '../../services/settings.js';
import { getSchema } from '../../utils/get-schema.js';
import { isFieldAllowed } from '../../utils/is-field-allowed.js';
import { type ScheduledJob, scheduleSynchronizedJob } from '../../utils/schedule.js';
import { getMessageType } from '../utils/message.js';
import { IRRELEVANT_COLLECTIONS } from './constants.js';
import { isVirtualRoomItem } from './is-virtual-room-item.js';
import { Messenger } from './messenger.js';
import { validateChanges } from './payload-permissions.js';
import { RoomManager } from './room.js';
import type {
	DiscardMessage,
	FocusMessage,
	JoinMessage,
	LeaveMessage,
	UpdateAllMessage,
	UpdateMessage,
} from './types.js';
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
	private initializePromise?: Promise<void> | undefined;
	private settingsService?: SettingsService;
	private cleanupJob?: ScheduledJob;
	private cleanupInterval?: NodeJS.Timeout;
	private busHandler?: (event: any) => void;
	private eventQueue = Promise.resolve();

	/**
	 * Initialize the handler
	 */
	constructor() {
		this.roomManager = new RoomManager(this.messenger);
		this.initialized = this.initialize();
		this.bindWebSocket();
		this.startBackgroundJobs();
	}

	initialize(force = false): Promise<void> {
		if (this.initialized && !force) return this.initialized;
		if (this.initializePromise) return this.initializePromise;

		this.initializePromise = (async () => {
			try {
				if (!this.settingsService) {
					const schema = await getSchema();
					this.settingsService = new SettingsService({ schema });
				}

				const settings = await this.settingsService.readSingleton({ fields: ['collaborative_editing_enabled'] });
				this.enabled = settings?.['collaborative_editing_enabled'] ?? true;
			} catch (err) {
				useLogger().error(err, '[Collab] Failed to initialize collaborative editing settings');
			} finally {
				this.initializePromise = undefined;
			}
		})();

		if (!this.initialized) {
			this.initialized = this.initializePromise;
		}

		return this.initializePromise;
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
		this.busHandler = (event: any) => {
			// Chain events to enforce sequence integrity
			this.eventQueue = this.eventQueue
				.then(async () => {
					if (
						event.collection === 'directus_settings' &&
						event.action === 'update' &&
						'collaborative_editing_enabled' in event.payload
					) {
						useLogger().debug(`[Collab] [Node ${this.messenger.uid}] Settings update via bus, triggering handler`);

						// Non-blocking initialization to avoid resource contention
						this.initialize(true)
							.then(() => {
								if (!this.enabled) {
									try {
										useLogger().debug(
											`[Collab] [Node ${this.messenger.uid}] Collaborative editing disabled, terminating all rooms`,
										);

										this.roomManager.terminateAll();
									} catch (err) {
										useLogger().error(err, '[Collab] Collaborative editing disabling terminateAll failed');
									}
								}
							})
							.catch((err) => {
								useLogger().error(err, '[Collab] Collaborative editing re-initialization failed');
							});

						return;
					}

					// Skip irrelevant collections and actions early
					if (event.action === 'create' || IRRELEVANT_COLLECTIONS.includes(event.collection)) {
						return;
					}

					if (event.action === 'update' || event.action === 'delete') {
						let keys: (string | number)[] = [];

						if (Array.isArray(event.keys)) {
							keys = event.keys;
						} else if (event.key) {
							keys = [event.key];
						} else if (event.payload && event.action === 'delete') {
							keys = toArray(event.payload);
						}

						event.keys = keys;

						const roomsToUpdate = Object.values(this.roomManager.rooms).filter((room) => {
							// Skip virtual rooms (eg: translations)
							if (isVirtualRoomItem(room.item)) return false;

							// Versioned Rooms
							if (room.version) {
								return event.collection === 'directus_versions' && keys.some((key) => String(key) === room.version);
							}

							// Skip non-matching collections and version events
							if (room.collection !== event.collection || event.collection === 'directus_versions') return false;

							// Match singleton
							if (room.item === null) return true;

							// Match regular items
							return keys.some((key) => String(key) === String(room.item));
						});

						if (roomsToUpdate.length === 0) return;

						await Promise.all(
							roomsToUpdate.map(async (room) => {
								let relevantKeys: any[];

								if (room.version) {
									relevantKeys = [room.version];
								} else if (room.item) {
									relevantKeys = [room.item];
								} else {
									relevantKeys = keys;
								}

								const singleKeyedEvent = { ...event, keys: relevantKeys };

								if (event.action === 'delete') {
									await room.onDeleteHandler(singleKeyedEvent);
								} else {
									await room.onUpdateHandler(singleKeyedEvent);
								}
							}),
						);
					}
				})
				.catch((err) => {
					useLogger().error(err, `[Collab] Bus message processing failed for ${event.collection}/${event.action}`);
				});
		};

		this.messenger.messenger.subscribe('websocket.event', this.busHandler);

		emitter.onAction('websocket.connect', ({ client }) => {
			this.messenger.addClient(client);
		});

		// listen to incoming messages on the connected websockets
		emitter.onAction('websocket.message', async ({ client, message }) => {
			if (getMessageType(message) !== WS_TYPE.COLLAB) return;

			try {
				await this.ensureEnabled();
			} catch (error) {
				if (error instanceof ServiceUnavailableError && error.message.includes('Collaborative editing is disabled')) {
					this.messenger.handleError(client.uid, error, message.action);
					this.messenger.terminateClient(client.uid);
					return;
				}

				throw error;
			}

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
	}

	startBackgroundJobs() {
		this.cleanupJob = scheduleSynchronizedJob('collab', CLUSTER_CLEANUP_CRON, async () => {
			const { inactive } = await this.messenger.pruneDeadInstances();

			// Remove clients and close rooms hosted by nodes that are now dead
			for (const roomUid of inactive.rooms) {
				const room = await this.roomManager.getRoom(roomUid);

				if (room) {
					// Remove dead clients globally
					for (const client of inactive.clients) {
						if (await room.hasClient(client)) {
							useLogger().debug(`[Collab] Removing dead client ${client} from room ${roomUid}`);
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

		this.cleanupInterval = setInterval(async () => {
			try {
				// Remove local clients that are no longer in the global registry
				const globalClients = await this.messenger.getGlobalClients();
				const localClients = (await this.roomManager.getLocalRoomClients()).map((client) => client.uid);
				const invalidClients = difference(localClients, globalClients);

				for (const client of invalidClients) {
					const rooms = await this.roomManager.getClientRooms(client);

					for (const room of rooms) {
						useLogger().debug(`[Collab] Removing invalid client ${client} from room ${room.getDisplayName()}`);

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
	 * Terminate the handler and stop background jobs
	 */
	async terminate() {
		await this.cleanupJob?.stop();

		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
		}

		if (this.busHandler) {
			await this.messenger.messenger.unsubscribe('websocket.event', this.busHandler);
		}
	}

	/**
	 * Ensure collaborative editing is enabled and initialized
	 */
	async ensureEnabled() {
		await this.initialized;

		if (!this.enabled) {
			throw new ServiceUnavailableError({
				reason: 'Collaborative editing is disabled',
				service: 'collab',
			});
		}
	}

	/**
	 * Join a collaborative editing room
	 */
	async onJoin(client: WebSocketClient, message: JoinMessage) {
		if (client.accountability?.share) {
			throw new ForbiddenError({
				reason: 'Collaborative editing is not supported for shares',
			});
		}

		const schema = await getSchema();
		const db = getDatabase();

		const isVirtualItem = isVirtualRoomItem(message.item);

		let readFields = await verifyPermissions(
			client.accountability!,
			message.collection,
			isVirtualItem ? null : message.item,
			'read',
			{
				knex: db,
				schema,
			},
		);

		// Item doesn't exist, check collection-level read permissions
		if (readFields === null) {
			readFields = await verifyPermissions(client.accountability!, message.collection, null, 'read', {
				knex: db,
				schema,
			});
		}

		if (!readFields || readFields.length === 0) {
			throw new ForbiddenError({
				reason: `No permission to access item or it does not exist`,
			});
		}

		// Item exists, user has read access, check version access
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

			if (!versionAccessAllowed) {
				throw new ForbiddenError({
					reason: `No permission to access item or it does not exist`,
				});
			}
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
	 * Leave a collaborative editing room
	 */
	async onLeave(client: WebSocketClient, message?: LeaveMessage) {
		if (message?.room) {
			const room = await this.roomManager.getRoom(message.room);

			if (!room || !(await room.hasClient(client.uid))) {
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

		// Unset should not acquire focus
		if (message.changes === undefined) {
			const currentFocuser = await room.getFocusByField(message.field);

			if (currentFocuser && currentFocuser !== client.uid) {
				throw new ForbiddenError({
					reason: `Field ${message.field} is already focused by another user`,
				});
			}
		} else {
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

		for (const key of fields) {
			const focus = await room.getFocusByField(key);

			if (focus && focus !== client.uid) {
				delete message.changes?.[key];
			}
		}

		if (!isEmpty(message.changes)) {
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
		const room = await this.roomManager.getRoom(message.room);

		if (!room || !(await room.hasClient(client.uid))) {
			throw new ForbiddenError({
				reason: `No access to room ${message.room} or room does not exist`,
			});
		}

		const knex = getDatabase();
		const schema = await getSchema();

		const allowedFields = await this.getAllowedFields(client, room, knex, schema);

		if (!allowedFields || allowedFields.length === 0) {
			throw new ForbiddenError({
				reason: `No permission to discard fields or item does not exist`,
			});
		}

		await room.discard(allowedFields);
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

		const allowedFields = await this.getAllowedFields(client, room, knex, schema);

		const fieldsArray = Array.isArray(fields) ? fields : [fields];

		for (const field of fieldsArray) {
			const fieldExists = !!schema.collections[room.collection]?.fields[field];

			if (!fieldExists || (allowedFields && !isFieldAllowed(allowedFields, field))) {
				throw new ForbiddenError({
					reason: `No permission to ${errorAction} field ${field} or field does not exist`,
				});
			}
		}
	}

	private async getAllowedFields(client: WebSocketClient, room: any, knex: any, schema: any): Promise<string[] | null> {
		const [read, update] = await Promise.all([
			verifyPermissions(client.accountability, room.collection, room.item, 'read', { knex, schema }),
			verifyPermissions(client.accountability, room.collection, room.item, 'update', { knex, schema }),
		]);

		if (read === null && update === null) return null;
		if (read === null) return update;
		if (update === null) return read;

		if (read.includes('*') && update.includes('*')) return ['*'];
		if (read.includes('*')) return update;
		if (update.includes('*')) return read;

		return intersection(read, update);
	}
}

import { createHash } from 'crypto';
import { ErrorCode } from '@directus/errors';
import { type Accountability, type Item, type PrimaryKey, type WebSocketClient, WS_TYPE } from '@directus/types';
import {
	ACTION,
	type BaseServerMessage,
	type ClientID,
	type Color,
	COLORS,
	type ServerError,
} from '@directus/types/collab';
import { isDetailedUpdateSyntax, isObject } from '@directus/utils';
import { isEqual, random, uniq } from 'lodash-es';
import getDatabase from '../../database/index.js';
import { useLogger } from '../../logger/index.js';
import { getSchema } from '../../utils/get-schema.js';
import { getService } from '../../utils/get-service.js';
import { isFieldAllowed } from '../../utils/is-field-allowed.js';
import { Messenger } from './messenger.js';
import { sanitizePayload } from './payload-permissions.js';
import { useStore } from './store.js';
import type { JoinMessage, PermissionClient } from './types.js';
import { verifyPermissions } from './verify-permissions.js';

/**
 * Store and manage all active collaboration rooms
 */
export class RoomManager {
	rooms: Record<string, Room> = {};
	messenger: Messenger;

	constructor(messenger: Messenger = new Messenger()) {
		this.messenger = messenger;
	}

	/**
	 * Create a new collaboration room or return an existing one matching collection, item and version.
	 */
	async createRoom(collection: string, item: PrimaryKey | null, version: string | null, initialChanges?: Item) {
		// Deterministic UID ensures clients on same resource join same room
		const uid = getRoomHash(collection, item, version);

		if (!(uid in this.rooms)) {
			const room = new Room(uid, collection, item, version, initialChanges, this.messenger);
			this.rooms[uid] = room;
			await room.ensureInitialized();
			await this.messenger.registerRoom(uid);
		}

		this.messenger.setRoomListener(uid, (message) => {
			if (message.action === 'close') {
				this.rooms[uid]?.dispose();
				delete this.rooms[uid];
			}
		});

		return this.rooms[uid]!;
	}

	/**
	 * Remove a room from local memory
	 */
	removeRoom(uid: string) {
		if (this.rooms[uid]) {
			delete this.rooms[uid];
		}
	}

	/**
	 * Get an existing room by UID.
	 * If the room is not part of the local rooms, it will be loaded from shared memory.
	 * The room will not be persisted in local memory.
	 */
	async getRoom(uid: string) {
		let room = this.rooms[uid];

		if (!room) {
			const store = useStore<RoomData>(uid);

			// Loads room from shared memory
			room = await store(async (store) => {
				if (!(await store.has('uid'))) return;

				const collection = await store.get('collection');
				const item = await store.get('item');
				const version = await store.get('version');
				const changes = await store.get('changes');

				const room = new Room(uid, collection, item, version, changes, this.messenger);
				this.rooms[uid] = room;

				return room;
			});
		}

		await room?.ensureInitialized();

		return room;
	}

	/**
	 * Get all rooms a client is currently in from global memory
	 */
	async getClientRooms(uid: ClientID) {
		const rooms = [];
		const globalRooms = await this.messenger.getGlobalRooms();

		for (const roomId of Object.values(globalRooms)) {
			const room = await this.getRoom(roomId);

			if (room && (await room.hasClient(uid))) {
				rooms.push(room);
			}
		}

		return rooms;
	}

	/**
	 * Returns all clients that are part of a room in the local memory
	 */
	async getLocalRoomClients(): Promise<RoomClient[]> {
		return (await Promise.all(Object.values(this.rooms).map((room) => room.getClients()))).flat();
	}

	/**
	 * Remove empty rooms from local memory
	 */
	async cleanupRooms(uids?: string[]) {
		const rooms = uids ? uids.map((uid) => this.rooms[uid]).filter((room) => !!room) : Object.values(this.rooms);

		for (const room of rooms) {
			if (await room.close()) {
				delete this.rooms[room.uid];
				useLogger().info(`[Collab] Closed inactive room ${room.getDisplayName()}`);
			}
		}
	}

	/**
	 * Forcefully close all local rooms and notify clients.
	 */
	async terminateAll() {
		const rooms = Object.values(this.rooms);

		for (const room of rooms) {
			await room.close({
				force: true,
				reason: {
					type: WS_TYPE.COLLAB,
					action: ACTION.SERVER.ERROR,
					code: ErrorCode.ServiceUnavailable,
					message: 'Collaboration is disabled',
				},
				terminate: true,
			});

			delete this.rooms[room.uid];
		}

		useLogger().info(`[Collab] Forcefully closed all ${rooms.length} active rooms`);
	}
}

type RoomClient = { uid: ClientID; accountability: Accountability; color: Color };

type RoomData = {
	uid: string;
	collection: string;
	item: PrimaryKey | null;
	version: string | null;
	changes: Item;
	clients: RoomClient[];
	focuses: Record<ClientID, string>;
};

const roomDefaults = {
	changes: {},
	clients: [],
	focuses: {},
};

/**
 * Represents a single collaboration room for a specific item
 */
export class Room {
	uid: string;
	collection: string;
	item: PrimaryKey | null;
	version: string | null;
	initialChanges: Item | undefined;
	messenger: Messenger;
	store;
	onUpdateHandler: (meta: Record<string, any>, context?: any) => Promise<void>;
	onDeleteHandler: (meta: Record<string, any>, context?: any) => Promise<void>;

	constructor(
		uid: string,
		collection: string,
		item: PrimaryKey | null,
		version: string | null,
		initialChanges?: Item,
		messenger: Messenger = new Messenger(),
	) {
		this.uid = uid;
		this.collection = collection;
		this.item = item;
		this.version = version;
		this.initialChanges = initialChanges;
		this.messenger = messenger;
		this.store = useStore<RoomData>(uid, roomDefaults);

		this.onUpdateHandler = async (meta) => {
			const { keys } = meta as { keys: PrimaryKey[] };

			const target = this.version ?? this.item;

			// Skip updates for different items (singletons have item=null)
			if (target !== null && !keys.some((key) => String(key) === String(target))) return;

			try {
				const schema = await getSchema();

				const result = await (async () => {
					if (this.version) {
						const service = getService('directus_versions', { schema });
						const versionData = await service.readOne(this.version);
						return versionData['delta'] ?? {};
					}

					const service = getService(collection, { schema });
					return item ? await service.readOne(item) : await service.readSingleton({});
				})();

				const clients = await this.store(async (store) => {
					let changes = await store.get('changes');

					changes = Object.fromEntries(
						Object.entries(changes).filter(([key, value]) => {
							// Always clear relational fields after save to prevent duplicate creation
							if (isDetailedUpdateSyntax(value)) return false;

							// Partial delta for versions and full record for regular items
							if (!(key in result)) return !!this.version;

							// For primitives, only clear if saved value matches pending change
							if (isEqual(value, result[key])) return false;

							// Reconcile M2O objects with the PK in result
							if (isObject(value)) {
								const relation = schema.relations.find((r: any) => r.collection === collection && r.field === key);

								if (relation) {
									const pkField = schema.collections[relation.related_collection as string]?.primary;

									if (pkField && isEqual((value as any)[pkField], result[key])) {
										return false;
									}
								}
							}

							return true;
						}),
					);

					await store.set('changes', changes);

					return await store.get('clients');
				});

				for (const client of clients) {
					this.send(client.uid, {
						action: ACTION.SERVER.SAVE,
					});
				}
			} catch (err) {
				useLogger().error(err, `[Collab] External update handler failed for ${collection}/${item ?? 'singleton'}`);
			}
		};

		this.onDeleteHandler = async (meta) => {
			try {
				const { keys, collection: eventCollection } = meta as { keys: PrimaryKey[]; collection: string };

				// Skip deletions for different versions
				const isVersionMatch =
					this.version && eventCollection === 'directus_versions' && keys.some((key) => String(key) === this.version);

				// Skip deletions for different items (singletons have item=null)
				const isItemMatch =
					eventCollection === collection && (item === null || keys.some((key) => String(key) === String(item)));

				if (!isVersionMatch && !isItemMatch) return;

				await this.sendAll({
					action: ACTION.SERVER.DELETE,
				});

				await this.close({ force: true });
			} catch (err) {
				useLogger().error(err, `[Collab] External delete handler failed for ${collection}/${item ?? 'singleton'}`);
			}
		};
	}

	/**
	 * Ensures that foundational room state (metadata) exists in shared memory even after restarts
	 */
	async ensureInitialized() {
		this.store(async (store) => {
			if (await store.has('uid')) return;

			await store.set('uid', this.uid);
			await store.set('collection', this.collection);
			await store.set('item', this.item);
			await store.set('version', this.version);
			await store.set('changes', this.initialChanges ?? {});
			await store.set('clients', []);
			await store.set('focuses', {});
		});
	}

	getDisplayName() {
		return [this.collection, this.item, this.version].filter(Boolean).join(':');
	}

	async getClients() {
		return this.store((store) => store.get('clients'));
	}

	async getFocuses() {
		return this.store((store) => store.get('focuses'));
	}

	async getChanges() {
		return this.store((store) => store.get('changes'));
	}

	async hasClient(id: ClientID) {
		return this.store(async (store) => {
			const clients = await store.get('clients');

			return clients.findIndex((c) => c.uid === id) !== -1;
		});
	}

	async getFocusByUser(id: ClientID) {
		return this.store(async (store) => (await store.get('focuses'))[id]);
	}

	async getFocusByField(field: string) {
		return this.store(async (store) => {
			const focuses = await store.get('focuses');

			return Object.entries(focuses).find(([_, f]) => f === field)?.[0];
		});
	}

	/**
	 * Client requesting to join a room. If the client hasn't entered the room already, add a new client.
	 * Otherwise all users just will be informed again that the user has joined.
	 */
	async join(client: WebSocketClient, color?: JoinMessage['color']) {
		this.messenger.addClient(client);

		let added = false;
		let clientColor: Color | undefined;

		if (!(await this.hasClient(client.uid)))
			await this.store(async (store) => {
				const clients = await store.get('clients');
				added = true;

				const existingColors = clients.map((c) => c.color);
				const colorsAvailable = COLORS.filter((color) => !existingColors.includes(color));

				if (colorsAvailable.length === 0) {
					colorsAvailable.push(...COLORS);
				}

				if (color && colorsAvailable.includes(color)) {
					clientColor = color;
				} else {
					clientColor = colorsAvailable[random(colorsAvailable.length - 1)]!;
				}

				clients.push({
					uid: client.uid,
					accountability: client.accountability!,
					color: clientColor,
				});

				await store.set('clients', clients);
			});

		if (added && clientColor) {
			await this.sendExcluding(
				{
					action: ACTION.SERVER.JOIN,
					user: client.accountability!.user!,
					connection: client.uid,
					color: clientColor,
				},
				client.uid,
			);
		}

		const { changes, focuses, clients } = await this.store(async (store) => {
			return {
				changes: await store.get('changes'),
				focuses: await store.get('focuses'),
				clients: await store.get('clients'),
			};
		});

		const schema = await getSchema();
		const knex = getDatabase();

		const allowedFields = await verifyPermissions(client.accountability, this.collection, this.item, 'read', {
			schema,
			knex,
		});

		this.send(client.uid, {
			action: ACTION.SERVER.INIT,
			collection: this.collection,
			item: this.item,
			version: this.version,
			changes: (await sanitizePayload(changes as Record<string, unknown>, this.collection, {
				accountability: client.accountability,
				schema,
				knex,
				itemId: this.item,
			})) as Item,
			focuses: Object.fromEntries(
				Object.entries(focuses).filter(([_, field]) => allowedFields === null || isFieldAllowed(allowedFields, field)),
			),
			connection: client.uid,
			users: Array.from(clients).map((client) => ({
				user: client.accountability.user!,
				connection: client.uid,
				color: client.color,
			})),
		});
	}

	/**
	 * Leave the room
	 */
	async leave(uid: ClientID) {
		await this.store(async (store) => {
			const clients = (await store.get('clients')).filter((c: RoomClient) => c.uid !== uid);

			await store.set('clients', clients);

			const focuses = await store.get('focuses');

			if (uid in focuses) {
				delete focuses[uid];
				await store.set('focuses', focuses);
			}

			if (clients.length === 0) {
				await store.set('changes', {});
			}
		});

		this.sendAll({
			action: ACTION.SERVER.LEAVE,
			connection: uid,
		});
	}

	/**
	 * Propagate an update to other clients
	 */
	async update(sender: WebSocketClient, changes: Record<string, unknown>) {
		const { clients } = await this.store(async (store) => {
			const existing_changes = await store.get('changes');
			Object.assign(existing_changes, changes);
			await store.set('changes', existing_changes);

			return {
				clients: await store.get('clients'),
			};
		});

		const schema = await getSchema();
		const knex = getDatabase();

		for (const client of clients) {
			if (client.uid === sender.uid) continue;

			const sanitizedChanges =
				((await sanitizePayload(changes, this.collection, {
					accountability: client.accountability,
					schema,
					knex,
					itemId: this.item,
				})) as Record<string, unknown>) || {};

			for (const field of Object.keys(changes)) {
				if (field in sanitizedChanges) {
					this.send(client.uid, {
						action: ACTION.SERVER.UPDATE,
						field,
						changes: sanitizedChanges[field],
					});
				}
			}
		}
	}

	/**
	 * Propagate an unset to other clients
	 */
	async unset(sender: PermissionClient, field: string) {
		const clients = await this.store(async (store) => {
			const changes = await store.get('changes');
			delete changes[field];
			await store.set('changes', changes);

			return await store.get('clients');
		});

		const schema = await getSchema();
		const knex = getDatabase();

		for (const client of clients) {
			if (client.uid === sender.uid) continue;

			const allowedFields = await verifyPermissions(client.accountability, this.collection, this.item, 'read', {
				schema,
				knex,
			});

			if (field && allowedFields !== null && !isFieldAllowed(allowedFields, field)) continue;

			this.send(client.uid, {
				action: ACTION.SERVER.DISCARD,
				fields: [field],
			});
		}
	}

	/**
	 * Discard specified changes in the room and propagate to other clients
	 */
	async discard(fields: string[]): Promise<void> {
		if (fields.length === 0) return;

		const clients = await this.store(async (store) => {
			let changes = await store.get('changes');

			if (fields.includes('*')) {
				changes = {};
			} else {
				for (const field of fields) {
					delete changes[field];
				}
			}

			await store.set('changes', changes);

			return await store.get('clients');
		});

		const schema = await getSchema();
		const knex = getDatabase();

		for (const client of clients) {
			const allowedFields = await verifyPermissions(client.accountability, this.collection, this.item, 'read', {
				schema,
				knex,
			});

			const sendFields: string[] = [];

			if (fields.includes('*')) {
				sendFields.push(...(allowedFields ?? []));
			} else {
				for (const field of fields) {
					if (allowedFields?.includes('*') || allowedFields?.includes(field)) {
						sendFields.push(field);
					}
				}
			}

			this.send(client.uid, {
				action: ACTION.SERVER.DISCARD,
				fields: uniq(sendFields),
			});
		}
	}

	/**
	 * Atomically acquire or release focus and propagate focus state to other clients
	 */
	async focus(sender: PermissionClient, field: string | null): Promise<boolean> {
		const result = await this.store(async (store) => {
			const focuses = await store.get('focuses');
			const clients = await store.get('clients');

			if (field === null) {
				const focusedField = focuses[sender.uid];
				delete focuses[sender.uid];
				await store.set('focuses', focuses);
				return { success: true, clients, focusedField };
			}

			const currentFocuser = Object.entries(focuses).find(([_, f]) => f === field)?.[0];

			if (currentFocuser && currentFocuser !== sender.uid) {
				return { success: false };
			}

			focuses[sender.uid] = field;
			await store.set('focuses', focuses);
			return { success: true, clients, focusedField: field };
		});

		if (!result.success) return false;

		const schema = await getSchema();
		const knex = getDatabase();

		for (const client of result.clients!) {
			if (client.uid === sender.uid) continue;

			const allowedFields = await verifyPermissions(client.accountability, this.collection, this.item, 'read', {
				schema,
				knex,
			});

			if (result.focusedField && allowedFields !== null && !isFieldAllowed(allowedFields, result.focusedField))
				continue;

			this.send(client.uid, {
				action: ACTION.SERVER.FOCUS,
				connection: sender.uid,
				field,
			});
		}

		return true;
	}

	async sendAll(message: BaseServerMessage) {
		for (const client of await this.getClients()) {
			this.send(client.uid, message);
		}
	}

	async sendExcluding(message: BaseServerMessage, exclude: ClientID) {
		for (const client of await this.getClients()) {
			if (client.uid !== exclude) {
				this.send(client.uid, message);
			}
		}
	}

	send(client: ClientID, message: BaseServerMessage) {
		// Route via Messenger for multi-instance scaling
		this.messenger.sendClient(client, { ...message, type: WS_TYPE.COLLAB, room: this.uid });
	}

	/**
	 * Close the room and clean up shared state
	 *
	 * @param options.force If true, close the room even if active clients are present
	 * @param options.reason Optional reason to be sent to clients
	 * @param options.terminate If true, forcefully terminate the client connection after closing
	 */
	async close(options: { force?: boolean; reason?: ServerError; terminate?: boolean } = {}) {
		const { force = false, reason, terminate = false } = options;

		let roomClients: RoomClient[] = [];

		if (force) {
			roomClients = await this.getClients();

			for (const client of roomClients) {
				if (this.messenger.hasClient(client.uid)) {
					if (reason) this.messenger.sendError(client.uid, reason);
					if (terminate) this.messenger.terminateClient(client.uid);
				}
			}
		}

		const closed = await this.store(async (store) => {
			if (!force) {
				const clients = await store.get('clients');
				if (clients.length > 0) return false;
			}

			if (!(await store.has('uid'))) return false;

			await store.delete('uid');
			await store.delete('collection');
			await store.delete('item');
			await store.delete('version');
			await store.delete('changes');
			await store.delete('clients');
			await store.delete('focuses');
			return true;
		});

		if (closed) {
			await this.messenger.unregisterRoom(this.uid);
			this.messenger.sendRoom(this.uid, { action: 'close' });

			if (force) {
				for (const client of roomClients) {
					if (!this.messenger.hasClient(client.uid)) {
						if (reason) this.messenger.sendError(client.uid, reason);
						if (terminate) this.messenger.terminateClient(client.uid);
					}
				}
			}
		}

		if (closed || force) {
			this.dispose();
		}

		return closed;
	}

	dispose() {
		this.messenger.removeRoomListener(this.uid);
	}
}

export function getRoomHash(collection: string, item: PrimaryKey | null, version: string | null) {
	return createHash('sha256').update([collection, item, version].join('-')).digest('hex');
}

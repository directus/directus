import { createHash } from 'crypto';
import { type Accountability, type ActionHandler, type Item, type WebSocketClient, WS_TYPE } from '@directus/types';
import { ACTION, type BaseServerMessage, type ClientID, type Color, COLORS } from '@directus/types/collab';
import { random } from 'lodash-es';
import getDatabase from '../../../database/index.js';
import emitter from '../../../emitter.js';
import { useLogger } from '../../../logger/index.js';
import { getSchema } from '../../../utils/get-schema.js';
import { getService } from '../../../utils/get-service.js';
import { Messenger } from './messenger.js';
import { sanitizePayload } from './sanitize-payload.js';
import { useStore } from './store.js';
import type { PermissionClient } from './types.js';
import { verifyPermissions } from './verify-permissions.js';

/**
 * Store and manage all active collaboration rooms
 */
export class CollabRooms {
	rooms: Record<string, Room> = {};
	messenger: Messenger;

	constructor(messenger: Messenger = new Messenger()) {
		this.messenger = messenger;
	}

	/**
	 * Create a new collaboration room
	 */
	async createRoom(collection: string, item: string | null, version: string | null, initialChanges?: Item) {
		// Deterministic UID ensures clients on same resource join same room
		const uid = getRoomHash(collection, item, version);

		if (!(uid in this.rooms)) {
			const room = new Room(uid, collection, item, version, initialChanges, this.messenger);
			this.rooms[uid] = room;
			await room.init();
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
	 * Remove a room from memory
	 */
	removeRoom(uid: string) {
		if (this.rooms[uid]) {
			delete this.rooms[uid];
		}
	}

	/**
	 * Get an existing room by UID
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

		return room;
	}

	/**
	 * Get all rooms a client is currently in
	 */
	async getClientRooms(uid: ClientID) {
		const rooms = [];

		for (const room of Object.values(this.rooms)) {
			if (await room.hasClient(uid)) {
				rooms.push(room);
			}
		}

		return rooms;
	}

	async getAllClients(): Promise<RoomClient[]> {
		const clients = [];

		for (const room of Object.values(this.rooms)) {
			clients.push(...(await room.getClients()));
		}

		return clients;
	}

	/**
	 * Remove empty rooms
	 */
	async cleanupRooms(uids?: string[]) {
		const rooms = uids ? uids.map((uid) => this.rooms[uid]).filter((room) => !!room) : Object.values(this.rooms);

		for (const room of rooms) {
			if (await room.close()) {
				delete this.rooms[room.uid];
				useLogger().info(`[Collab] Closed inactive room ${room.uid}`);
			}
		}
	}
}

type RoomClient = { uid: ClientID; accountability: Accountability; color: Color };

type RoomData = {
	uid: string;
	collection: string;
	item: string | null;
	version: string | null;
	changes: Item;
	clients: RoomClient[];
	focuses: Record<ClientID, string>;
};

/**
 * Represents a single collaboration room for a specific item
 */
export class Room {
	uid: string;
	collection: string;
	item: string | null;
	version: string | null;
	initialChanges: Item | undefined;
	messenger: Messenger;
	store;
	onUpdateHandler: ActionHandler;
	onDeleteHandler: ActionHandler;

	constructor(
		uid: string,
		collection: string,
		item: string | null,
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
		this.store = useStore<RoomData>(uid);

		this.onUpdateHandler = async (meta, context) => {
			const { keys } = meta as { keys: string[] };
			const { accountability } = context;

			// Skip updates for different items (singletons have item=null)
			if (item !== null && !keys.includes(item)) return;

			try {
				const sudoService = getService(collection, { schema: await getSchema() });

				const result = item ? await sudoService.readOne(item) : await sudoService.readSingleton({});

				const clients = await this.store(async (store) => {
					await this.ensureInitialized(store);
					let changes = await this.getChanges(store);

					changes = Object.fromEntries(Object.entries(changes).filter(([key]) => key in result));

					await store.set('changes', changes);

					return await this.getClients(store);
				});

				for (const client of clients) {
					if (client.accountability?.user === accountability?.user) continue;

					this.send(client.uid, {
						action: ACTION.SERVER.SAVE,
					});
				}
			} catch (err) {
				useLogger().error(err, `[Collab] External update handler failed for ${collection}/${item ?? 'singleton'}`);
			}
		};

		this.onDeleteHandler = async (meta) => {
			const { keys } = meta as { keys: string[] };

			// Skip deletions for different items (singletons have item=null)
			if (item !== null && !keys.includes(item)) return;

			this.sendAll({
				action: ACTION.SERVER.DELETE,
			});

			await this.close(true);
		};

		// React to external updates (eg: REST API) to sync connected clients
		emitter.onAction(`${collection}.items.update`, this.onUpdateHandler);
		emitter.onAction(`${collection}.items.delete`, this.onDeleteHandler);
	}

	/**
	 * Initialize the room's state in shared memory
	 */
	async init() {
		return await this.store((s) => this.ensureInitialized(s));
	}

	/**
	 * Ensures that foundational room state (metadata) exists in shared memory even after restarts
	 */
	private async ensureInitialized(store: any) {
		if (await store.has('uid')) return;

		await store.set('uid', this.uid);
		await store.set('collection', this.collection);
		await store.set('item', this.item);
		await store.set('version', this.version);
		await store.set('changes', this.initialChanges ?? {});
		await store.set('clients', []);
		await store.set('focuses', {});
	}

	async getClients(store?: any): Promise<RoomClient[]> {
		if (store) return (await store.get('clients')) ?? [];
		return await this.store((s) => this.getClients(s));
	}

	async getFocuses(store?: any): Promise<Record<ClientID, string>> {
		if (store) return (await store.get('focuses')) ?? {};
		return await this.store((s) => this.getFocuses(s));
	}

	async hasClient(id: ClientID, store?: any) {
		const clients = await this.getClients(store);
		return clients.some((c: RoomClient) => c.uid === id);
	}

	async getFocusByUser(id: ClientID, store?: any) {
		const focuses = await this.getFocuses(store);
		return focuses[id];
	}

	async getFocusByField(field: string, store?: any) {
		const focuses = await this.getFocuses(store);
		return Object.entries(focuses).find(([_, f]) => f === field)?.[0];
	}

	async getChanges(store?: any): Promise<Item> {
		if (store) return (await store.get('changes')) ?? {};
		return await this.store((s) => this.getChanges(s));
	}

	/**
	 * Join the room
	 */
	async join(client: WebSocketClient) {
		this.messenger.addClient(client);

		let added = false;
		let clientColor: Color | undefined;

		await this.store(async (store) => {
			await this.ensureInitialized(store);

			if (await this.hasClient(client.uid, store)) return;

			const clients = await this.getClients(store);
			added = true;

			const existingColors = clients.map((c) => c.color);
			const colorsAvailable = COLORS.filter((color) => !existingColors.includes(color));

			if (colorsAvailable.length === 0) {
				colorsAvailable.push(...COLORS);
			}

			clientColor = colorsAvailable[random(colorsAvailable.length - 1)]!;

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

		const { changes, focuses, clients } = (await this.store(async (store) => {
			return {
				changes: await this.getChanges(store),
				focuses: await this.getFocuses(store),
				clients: await this.getClients(store),
			};
		})) as { changes: Item; focuses: Record<ClientID, string>; clients: RoomClient[] };

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
				action: 'read',
				knex,
			})) as Item,
			focuses: Object.fromEntries(
				Object.entries(focuses).filter(([_, field]) => allowedFields.includes(field) || allowedFields.includes('*')),
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
		this.messenger.removeClient(uid);

		await this.store(async (store) => {
			if (!(await this.hasClient(uid, store))) return;

			const clients = await this.getClients(store);

			await store.set(
				'clients',
				clients.filter((c: RoomClient) => c.uid !== uid),
			);

			const focuses = await this.getFocuses(store);

			if (uid in focuses) {
				delete focuses[uid];
				await store.set('focuses', focuses);
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
			await this.ensureInitialized(store);
			const existing_changes = await this.getChanges(store);
			Object.assign(existing_changes, changes);
			await store.set('changes', existing_changes);

			return {
				clients: await this.getClients(store),
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
					action: 'read',
					knex,
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
			await this.ensureInitialized(store);
			const changes = await this.getChanges(store);
			delete changes[field];
			await store.set('changes', changes);

			return await this.getClients(store);
		});

		const schema = await getSchema();
		const knex = getDatabase();

		for (const client of clients) {
			if (client.uid === sender.uid) continue;

			const allowedFields = await verifyPermissions(client.accountability, this.collection, this.item, 'read', {
				schema,
				knex,
			});

			if (field && !(allowedFields.includes(field) || allowedFields.includes('*'))) continue;

			this.send(client.uid, {
				action: ACTION.SERVER.UPDATE,
				field: field,
			});
		}
	}

	/**
	 * Atomically acquire or release focus and propagate focus state to other clients
	 */
	async focus(sender: PermissionClient, field: string | null): Promise<boolean> {
		const result = await this.store(async (store) => {
			await this.ensureInitialized(store);
			const focuses = await this.getFocuses(store);
			const clients = await this.getClients(store);

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

			if (result.focusedField && !(allowedFields.includes(result.focusedField) || allowedFields.includes('*')))
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
	 * Close the room and notify all clients
	 *
	 * @param force If true, close the room even if active clients are present
	 */
	async close(force = false) {
		const closed = await this.store(async (store) => {
			if (!force) {
				const clients = await this.getClients(store);
				if (clients.length > 0) return false;
			}

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
			this.dispose();
		}

		return closed;
	}

	dispose() {
		emitter.offAction(`${this.collection}.items.update`, this.onUpdateHandler);
		emitter.offAction(`${this.collection}.items.delete`, this.onDeleteHandler);
		this.messenger.removeRoomListener(this.uid);
	}
}

export function getRoomHash(collection: string, item: string | number | null, version: string | null) {
	return createHash('sha256').update([collection, item, version].join('-')).digest('hex');
}

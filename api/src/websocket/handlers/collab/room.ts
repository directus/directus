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
		const uid = getRoomHash(collection, item, version);

		if (!(uid in this.rooms)) {
			this.rooms[uid] = new Room(uid, collection, item, version, initialChanges, this.messenger);
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

				return new Room(uid, collection, item, version, changes, this.messenger);
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
			const clients = await room.getClients();

			if (clients.length === 0) {
				await room.close();
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
	messenger: Messenger;
	store;
	ready: Promise<void>;
	onUpdateHandler: ActionHandler;

	constructor(
		uid: string,
		collection: string,
		item: string | null,
		version: string | null,
		initialChanges?: Item,
		messenger: Messenger = new Messenger(),
	) {
		this.store = useStore<RoomData>(uid);

		this.ready = this.store(async (store) => {
			if (await store.has('uid')) return;

			await store.set('uid', uid);
			await store.set('collection', collection);
			await store.set('item', item);
			await store.set('version', version);
			await store.set('changes', initialChanges ?? {});

			// Default all other values
			await store.set('clients', []);
			await store.set('focuses', {});
		});

		this.uid = uid;
		this.collection = collection;
		this.item = item;
		this.messenger = messenger;

		this.onUpdateHandler = async (meta, context) => {
			const { keys } = meta as { keys: string[] };
			const { accountability } = context;

			// Skip if this update is for a different item (singletons have item=null)
			if (item !== null && !keys.includes(item)) return;

			try {
				const sudoService = getService(collection, { schema: await getSchema() });

				const result = item ? await sudoService.readOne(item) : await sudoService.readSingleton({});

				const clients = await this.store(async (store) => {
					let changes = await store.get('changes');

					changes = Object.fromEntries(Object.entries(changes).filter(([key]) => key in result));

					store.set('changes', changes);

					return await store.get('clients');
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

		// React to external updates to the item
		emitter.onAction(`${collection}.items.update`, this.onUpdateHandler);
	}

	async getCollection() {
		await this.ready;

		return await this.store(async (store) => {
			return await store.get('collection');
		});
	}

	async getClients() {
		await this.ready;

		return await this.store((store) => store.get('clients'));
	}

	async hasClient(id: ClientID) {
		await this.ready;

		return await this.store(async (store) => {
			const clients = await store.get('clients');

			return clients.findIndex((c) => c.uid === id) !== -1;
		});
	}

	async getFocusByUser(id: ClientID) {
		return await this.store(async (store) => (await store.get('focuses'))[id]);
	}

	async getFocusByField(field: string) {
		return await this.store(async (store) => {
			const focuses = await store.get('focuses');

			return Object.entries(focuses).find(([_, f]) => f === field)?.[0];
		});
	}

	/**
	 * Join the room
	 */
	async join(client: WebSocketClient) {
		this.messenger.addClient(client);
		await this.ready;

		let added = false;
		let clientColor: Color | undefined;

		if (!(await this.hasClient(client.uid))) {
			await this.store(async (store) => {
				const clients = await store.get('clients');
				const existingColors = clients.map((c) => c.color);
				const colorsAvailable = COLORS.filter((color) => !existingColors.includes(color));

				if (colorsAvailable.length === 0) {
					colorsAvailable.push(...COLORS);
				}

				if (clients.findIndex((c) => c.uid === client.uid) === -1) {
					added = true;
					clientColor = colorsAvailable[random(colorsAvailable.length - 1)]!;

					clients.push({
						uid: client.uid,
						accountability: client.accountability!,
						color: clientColor,
					});

					await store.set('clients', clients);
				}
			});
		}

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

		const { collection, item, version, changes, focuses, clients } = (await this.store(async (store) => {
			return {
				collection: await store.get('collection'),
				item: await store.get('item'),
				version: await store.get('version'),
				changes: await store.get('changes'),
				focuses: await store.get('focuses'),
				clients: await store.get('clients'),
			};
		})) as RoomData;

		const allowedFields = await verifyPermissions(client.accountability, collection, item);

		this.send(client.uid, {
			action: ACTION.SERVER.INIT,
			collection: collection,
			item: item,
			version: version,
			changes: (await sanitizePayload(collection, changes as Record<string, unknown>, {
				knex: getDatabase(),
				schema: await getSchema(),
				accountability: client.accountability!,
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
		await this.ready;

		if (!(await this.hasClient(uid))) return;

		await this.store(async (store) => {
			const clients = await store.get('clients');

			await store.set(
				'clients',
				clients.filter((c) => c.uid !== uid),
			);

			const focuses = await store.get('focuses');

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
		await this.ready;

		const { clients } = await this.store(async (store) => {
			const existing_changes = await store.get('changes');
			Object.assign(existing_changes, changes);
			await store.set('changes', existing_changes);

			return {
				clients: await store.get('clients'),
			};
		});

		for (const client of clients) {
			if (client.uid === sender.uid) continue;

			const sanitizedChanges = await sanitizePayload(this.collection, changes, {
				knex: getDatabase(),
				schema: await getSchema(),
				accountability: client.accountability,
			});

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
		await this.ready;

		const clients = await this.store(async (store) => {
			const changes = await store.get('changes');
			delete changes[field];
			await store.set('changes', changes);

			return await store.get('clients');
		});

		for (const client of clients) {
			if (client.uid === sender.uid) continue;

			const allowedFields = await verifyPermissions(client.accountability, this.collection, this.item);

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
		await this.ready;

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

		for (const client of result.clients!) {
			if (client.uid === sender.uid) continue;

			const allowedFields = await verifyPermissions(client.accountability, this.collection, this.item);

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
		await this.ready;

		const clients = await this.store(async (store) => {
			return await store.get('clients');
		});

		for (const client of clients) {
			this.messenger.sendClient(client.uid, { ...message, type: WS_TYPE.COLLAB, room: this.uid });
		}
	}

	async sendExcluding(message: BaseServerMessage, exclude: ClientID) {
		await this.ready;

		const clients = await this.store(async (store) => {
			return await store.get('clients');
		});

		for (const client of clients) {
			if (client.uid !== exclude) {
				this.messenger.sendClient(client.uid, { ...message, type: WS_TYPE.COLLAB, room: this.uid });
			}
		}
	}

	send(client: ClientID, message: BaseServerMessage) {
		this.messenger.sendClient(client, { ...message, type: WS_TYPE.COLLAB, room: this.uid });
	}

	/**
	 * Close the room and notify all clients
	 */
	async close() {
		await this.ready;
		this.messenger.sendRoom(this.uid, { action: 'close' });

		this.dispose();

		await this.store(async (store) => {
			await store.delete('uid');
			await store.delete('collection');
			await store.delete('item');
			await store.delete('version');
			await store.delete('changes');
			await store.delete('clients');
			await store.delete('focuses');
		});
	}

	dispose() {
		emitter.offAction(`${this.collection}.items.update`, this.onUpdateHandler);
		this.messenger.removeRoomListener(this.uid);
	}
}

export function getRoomHash(collection: string, item: string | number | null, version: string | null) {
	return createHash('sha256').update([collection, item, version].join('-')).digest('hex');
}

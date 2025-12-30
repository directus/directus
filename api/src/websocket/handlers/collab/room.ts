import { WS_TYPE, type Accountability, type Item, type WebSocketClient } from '@directus/types';
import { createHash } from 'crypto';
import { isEqual, random } from 'lodash-es';
import getDatabase from '../../../database/index.js';
import emitter from '../../../emitter.js';
import { getSchema } from '../../../utils/get-schema.js';
import { getService } from '../../../utils/get-service.js';
import { hasFieldPermision } from './field-permissions.js';
import { sanitizePayload } from './sanitize-payload.js';
import { Messenger } from './messenger.js';
import { useStore } from './store.js';
import { ACTION, COLORS, type BaseServerMessage, type ClientID, type Color } from '@directus/types/collab';

export class CollabRooms {
	rooms: Record<string, Room> = {};
	messenger: Messenger;

	constructor(messenger: Messenger = new Messenger()) {
		this.messenger = messenger;
	}

	async createRoom(collection: string, item: string | null, version: string | null, initialChanges?: Item) {
		const uid = getRoomHash(collection, item, version);

		if (!(uid in this.rooms)) {
			this.rooms[uid] = new Room(uid, collection, item, version, initialChanges, this.messenger);
		}

		this.messenger.setRoomListener(uid, (message) => {
			if (message.action === 'close') {
				delete this.rooms[uid];
			}
		});

		return this.rooms[uid]!;
	}

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

	async getClientRooms(client: WebSocketClient) {
		const rooms = [];

		for (const room of Object.values(this.rooms)) {
			if (await room.hasClient(client.uid)) {
				rooms.push(room);
			}
		}

		return rooms;
	}

	async cleanupRooms() {
		for (const room of Object.values(this.rooms)) {
			if ((await room.getClients()).length === 0) {
				await room.close();
				delete this.rooms[room.uid];
			}
		}
	}
}

type RoomData = {
	uid: string;
	collection: string;
	item: string | null;
	version: string | null;
	changes: Item;
	clients: { uid: ClientID; accountability: Accountability }[];
	clientColors: Record<ClientID, Color>;
	focuses: Record<ClientID, string>;
};

export class Room {
	uid: string;
	messenger: Messenger;
	store;
	listener: (...args: any[]) => void;

	constructor(
		uid: string,
		collection: string,
		item: string | null,
		version: string | null,
		initialChanges?: Item,
		messenger: Messenger = new Messenger(),
	) {
		this.store = useStore<RoomData>(uid);

		this.store(async (store) => {
			if (await store.has('uid')) return;

			await store.set('uid', uid);
			await store.set('collection', collection);
			await store.set('item', item);
			await store.set('version', version);
			// TODO: Have to merge multiple initial Changes somehow?
			await store.set('changes', initialChanges ?? {});

			// Default all other values
			await store.set('clientColors', {});
			await store.set('clients', []);
			await store.set('focuses', {});
		});

		this.uid = uid;
		this.messenger = messenger;

		this.listener = async ({ keys }: any, { accountability }: any) => {
			if (!keys.includes(item)) return;

			const service = getService(collection, { schema: await getSchema() });

			const result = item ? await service.readOne(item) : await service.readSingleton({});

			const clients = await this.store(async (store) => {
				let changes = await store.get('changes');

				changes = Object.fromEntries(Object.entries(changes).filter(([key, value]) => !isEqual(result[key], value)));

				store.set('changes', changes);

				return await store.get('clients');
			});

			for (const client of clients) {
				if (client.accountability?.user === accountability?.user) continue;

				this.send(client.uid, {
					action: ACTION.SERVER.SAVE,
				});
			}
		};

		// React to external updates to the item
		emitter.onAction(`${collection}.items.update`, this.listener);
	}

	async getCollection() {
		return await this.store(async (store) => {
			return await store.get('collection');
		});
	}

	async getClients() {
		return await this.store(async (store) => {
			return await store.get('clients');
		});
	}

	async hasClient(id: ClientID) {
		return await this.store(async (store) => {
			const clients = (await store.get('clients')) || [];

			return clients.findIndex((c) => c.uid === id) !== -1;
		});
	}

	async getFocusBy(id: ClientID) {
		return await this.store(async (store) => (await store.get('focuses'))[id]);
	}

	async join(client: WebSocketClient) {
		this.messenger.addClient(client);

		if (!(await this.hasClient(client.uid))) {
			const clientColor = COLORS[random(COLORS.length - 1)]!;

			await this.sendAll({
				action: ACTION.SERVER.JOIN,
				user: client.accountability!.user!,
				connection: client.uid,
				color: clientColor,
			});

			await this.store(async (store) => {
				const clientColors = await store.get('clientColors');
				clientColors[client.uid] = clientColor;
				await store.set('clientColors', clientColors);

				const clients = await store.get('clients');
				clients.push({ uid: client.uid, accountability: client.accountability! });
				await store.set('clients', clients);
			});
		}

		const { collection, item, version, clientColors, changes, focuses, clients } = await this.store(async (store) => {
			return {
				collection: await store.get('collection'),
				item: await store.get('item'),
				version: await store.get('version'),
				clientColors: (await store.get('clientColors')) || {},
				changes: (await store.get('changes')) || {},
				focuses: (await store.get('focuses')) || {},
				clients: (await store.get('clients')) || [],
			};
		});

		this.send(client.uid, {
			action: ACTION.SERVER.INIT,
			collection: collection,
			item: item,
			version: version,
			changes: await sanitizePayload(collection, changes, {
				knex: getDatabase(),
				schema: await getSchema(),
				accountability: client.accountability!,
			}),
			focuses: Object.fromEntries(
				Object.entries(focuses).filter(([_, field]) => hasFieldPermision(client.accountability!, collection, field)),
			),
			connection: client.uid,
			users: Array.from(clients).map((client) => ({
				user: client.accountability.user!,
				connection: client.uid,
				color: clientColors[client.uid]!,
			})),
		});

		client.on('close', async () => {
			await this.leave(client);
		});
	}

	async leave(client: WebSocketClient) {
		this.messenger.removeClient(client.uid);

		if (!(await this.hasClient(client.uid))) return;

		await this.store(async (store) => {
			const clients = await store.get('clients');

			await store.set(
				'clients',
				clients.filter((c) => c.uid !== client.uid),
			);
		});

		this.sendAll({
			action: ACTION.SERVER.LEAVE,
			connection: client.uid,
		});
	}

	async save(sender: WebSocketClient) {
		await this.store(async (store) => {
			await store.set('changes', {});
		});

		await this.sendExcluding(
			{
				action: ACTION.SERVER.SAVE,
			},
			sender.uid,
		);
	}

	async update(sender: WebSocketClient, field: string, changes: unknown) {
		const { clients, collection } = await this.store(async (store) => {
			const existing_changes = await store.get('changes');
			existing_changes[field] = changes;
			await store.set('changes', existing_changes);

			return { clients: await store.get('clients'), collection: await store.get('collection') };
		});

		for (const client of clients) {
			if (client.uid === sender.uid) continue;

			const item = await sanitizePayload(
				collection,
				{ [field]: changes },
				{
					knex: getDatabase(),
					schema: await getSchema(),
					accountability: client.accountability,
				},
			);

			if (field in item) {
				this.send(client.uid, {
					action: ACTION.SERVER.UPDATE,
					field,
					changes: item[field],
				});
			}
		}
	}

	async unset(sender: WebSocketClient, field: string) {
		const { clients, collection } = await this.store(async (store) => {
			const changes = await store.get('changes');
			delete changes[field];
			await store.set('changes', changes);

			return { clients: await store.get('clients'), collection: await store.get('collection') };
		});

		for (const client of clients) {
			if (client.uid === sender.uid) continue;

			if (field && !(await hasFieldPermision(client.accountability, collection, field))) continue;

			this.send(client.uid, {
				action: ACTION.SERVER.UPDATE,
				field: field,
			});
		}
	}

	async focus(sender: WebSocketClient, field: string | null) {
		const { clients, collection } = await this.store(async (store) => {
			const focuses = await store.get('focuses');

			if (!field) {
				delete focuses[sender.uid];
			} else {
				focuses[sender.uid] = field;
			}

			await store.set('focuses', focuses);

			return { clients: await store.get('clients'), collection: await store.get('collection') };
		});

		for (const client of clients) {
			if (client.uid === sender.uid) continue;

			if (field && !(await hasFieldPermision(client.accountability, collection, field))) continue;

			this.send(client.uid, {
				action: ACTION.SERVER.FOCUS,
				connection: sender.uid,
				field,
			});
		}
	}

	async sendAll(message: BaseServerMessage) {
		const clients = await this.store(async (store) => {
			return (await store.get('clients')) || [];
		});

		for (const client of clients) {
			this.messenger.sendClient(client.uid, { ...message, type: WS_TYPE.COLLAB, room: this.uid });
		}
	}

	async sendExcluding(message: BaseServerMessage, exclude: ClientID) {
		const clients = await this.store(async (store) => {
			return (await store.get('clients')) || [];
		});

		for (const client of clients) {
			if (client.uid !== exclude)
				this.messenger.sendClient(client.uid, { ...message, type: WS_TYPE.COLLAB, room: this.uid });
		}
	}

	send(client: ClientID, message: BaseServerMessage) {
		this.messenger.sendClient(client, { ...message, type: WS_TYPE.COLLAB, room: this.uid });
	}

	async close() {
		this.messenger.sendRoom(this.uid, { action: 'close' });

		await this.store(async (store) => {
			const collection = await store.get('collection');
			emitter.offAction(`${collection}.items.update`, this.listener);
			await store.delete('uid');
		});
	}
}

export function getRoomHash(collection: string, item: string | number | null, version: string | null) {
	return createHash('sha256').update([collection, item, version].join('-')).digest('hex');
}

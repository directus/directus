import {
	COLLAB,
	COLLAB_COLORS,
	type Accountability,
	type ClientBaseCollabMessage,
	type ClientID,
	type CollabColor,
	type Item,
	type WebSocketClient,
} from '@directus/types';
import { createHash } from 'crypto';
import { isEqual, random } from 'lodash-es';
import getDatabase from '../../../database/index.js';
import emitter from '../../../emitter.js';
import { getSchema } from '../../../utils/get-schema.js';
import { getService } from '../../../utils/get-service.js';
import { hasFieldPermision } from './field-permissions.js';
import { sanitizePayload } from './sanitize-payload.js';
import { Messenger } from './messenger.js';
import { useStore, type RedisStore } from './store.js';
import { RedisStoreError } from './errors.js';

export class CollabRooms {
	rooms: Record<string, Room> = {};
	messenger = new Messenger();

	async createRoom(collection: string, item: string | null, version: string | null, initialChanges?: Item) {
		const uid = getRoomHash(collection, item, version);

		if (!(uid in this.rooms)) {
			this.rooms[uid] = new Room(this.messenger, uid, collection, item, version, initialChanges);
		}

		return this.rooms[uid]!;
	}

	getRoom(uid: string) {
		return this.rooms[uid];
	}

	getClientRooms(client: WebSocketClient) {
		return Object.values(this.rooms).filter((room) => room.hasClient(client));
	}

	cleanupRooms() {
		for (const room of Object.values(this.rooms)) {
			if (room.clients.length === 0) {
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
	clientColors: Record<ClientID, CollabColor>;
	focuses: Record<ClientID, string>;
};

export class Room {
	uid: string;
	messenger: Messenger;
	store;

	constructor(
		messenger: Messenger,
		uid: string,
		collection: string,
		item: string | null,
		version: string | null,
		initialChanges?: Item,
	) {
		this.store = useStore<RoomData>(uid);

		this.store(async (store) => {
			if (await store.has('collection')) return;

			await store.set('collection', collection);
			await store.set('item', item);
			await store.set('version', version);
			// TODO: Have to merge multiple initial Changes somehow?
			await store.set('changes', initialChanges ?? {});
		});

		this.messenger = messenger;
		this.uid = uid;

		// React to external updates to the item
		emitter.onAction(`${collection}.items.update`, async ({ keys }, { accountability }) => {
			if (!keys.includes(item)) return;

			const service = getService(collection, { schema: await getSchema() });

			const result = item ? await service.readOne(item) : await service.readSingleton({});

			await this.store(async (store) => {
				let changes = (await store.get('changes')) ?? {};

				changes = Object.fromEntries(Object.entries(changes).filter(([key, value]) => !isEqual(result[key], value)));

				store.set('changes', changes);
			});

			for (const client of this.clients) {
				if (client.accountability?.user === accountability?.user) continue;

				this.send(client.uid, {
					action: 'save',
				});
			}
		});
	}

	hasClient(client: WebSocketClient) {
		return this.clients.findIndex((c) => c.uid === client.uid) !== -1;
	}

	async join(client: WebSocketClient) {
		if (!this.hasClient(client)) {
			const clientColor = COLLAB_COLORS[random(COLLAB_COLORS.length - 1)]!;
			this.clientColors[client.uid] = clientColor;

			this.sendAll({
				action: 'join',
				user: client.accountability!.user!,
				connection: client.uid,
				color: clientColor,
			});

			this.clients.push({ uid: client.uid, accountability: client.accountability! });
		}

		this.send(client.uid, {
			action: 'init',
			collection: this.collection,
			item: this.item,
			version: this.version,
			changes: await sanitizePayload(this.collection, this.changes, {
				knex: getDatabase(),
				schema: await getSchema(),
				accountability: client.accountability!,
			}),
			focuses: Object.fromEntries(
				Object.entries(this.focuses).filter(([_, field]) =>
					hasFieldPermision(client.accountability!, this.collection, field),
				),
			),
			connection: client.uid,
			users: Array.from(this.clients).map((client) => ({
				user: client.accountability.user!,
				connection: client.uid,
				color: this.clientColors[client.uid]!,
			})),
		});

		client.on('close', () => {
			this.leave(client);
		});
	}

	leave(client: WebSocketClient) {
		if (!this.hasClient(client)) return;

		this.clients = this.clients.filter((c) => c.uid !== client.uid);

		this.sendAll({
			action: 'leave',
			connection: client.uid,
		});
	}

	save(sender: WebSocketClient) {
		this.changes = {};

		this.sendExcluding(
			{
				action: 'save',
			},
			sender.uid,
		);
	}

	async update(sender: WebSocketClient, field: string, changes: unknown) {
		this.changes[field] = changes;

		for (const client of this.clients) {
			if (client.uid === sender.uid) continue;

			const item = await sanitizePayload(
				this.collection,
				{ [field]: changes },
				{
					knex: getDatabase(),
					schema: await getSchema(),
					accountability: client.accountability,
				},
			);

			if (field in item) {
				this.send(client.uid, {
					action: 'update',
					field,
					changes: item[field],
				});
			}
		}
	}

	async unset(field: string) {
		delete this.changes[field];

		for (const client of this.clients) {
			if (field && !(await hasFieldPermision(client.accountability, this.collection, field))) continue;

			this.send(client.uid, {
				action: 'update',
				field: field,
			});
		}
	}

	async focus(sender: WebSocketClient, field: string | null) {
		if (!field) {
			delete this.focuses[sender.uid];
		} else {
			this.focuses[sender.uid] = field;
		}

		for (const client of this.clients) {
			if (field && !(await hasFieldPermision(client.accountability, this.collection, field))) continue;

			this.send(client.uid, {
				action: 'focus',
				connection: sender.uid,
				field,
			});
		}
	}

	sendAll(message: ClientBaseCollabMessage) {
		for (const client of this.clients) {
			this.messenger.send(client.uid, { ...message, type: COLLAB, room: this.uid });
		}
	}

	sendExcluding(message: ClientBaseCollabMessage, exclude: ClientID) {
		for (const client of this.clients) {
			if (client.uid !== exclude) this.messenger.send(client.uid, { ...message, type: COLLAB, room: this.uid });
		}
	}

	send(client: ClientID, message: ClientBaseCollabMessage) {
		this.messenger.send(client, { ...message, type: COLLAB, room: this.uid });
	}
}

export function getRoomHash(collection: string, item: string | number | null, version: string | null) {
	return createHash('sha256').update([collection, item, version].join('-')).digest('hex');
}

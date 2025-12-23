import { WS_TYPE, type Item, type WebSocketClient } from '@directus/types';
import { createHash } from 'crypto';
import { isEqual, random } from 'lodash-es';
import getDatabase from '../../../database/index.js';
import emitter from '../../../emitter.js';
import { getSchema } from '../../../utils/get-schema.js';
import { getService } from '../../../utils/get-service.js';
import { hasFieldPermision } from './field-permissions.js';
import { sanitizePayload } from './sanitize-payload.js';
import { ACTION, COLORS, type BaseServerMessage, type ClientID, type Color } from '@directus/types/collab';

export class CollabRooms {
	rooms: Record<string, Room> = {};

	async createRoom(collection: string, item: string | null, version: string | null, initialChanges?: Item) {
		const uid = getRoomHash(collection, item, version);

		if (!(uid in this.rooms)) {
			this.rooms[uid] = new Room(uid, collection, item, version, initialChanges);
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

export class Room {
	uid: string;
	collection: string;
	item: string | null;
	version: string | null;
	changes: Item;
	clients: WebSocketClient[] = [];
	clientColors: Record<ClientID, Color> = {};
	focuses: Record<ClientID, string> = {};

	constructor(uid: string, collection: string, item: string | null, version: string | null, initialChanges?: Item) {
		this.uid = uid;
		this.collection = collection;
		this.item = item;
		this.version = version;
		this.changes = initialChanges ?? {};

		// React to external updates to the item
		emitter.onAction(`${this.collection}.items.update`, async ({ keys }, { accountability }) => {
			if (!keys.includes(this.item)) return;

			const service = getService(this.collection, { schema: await getSchema() });

			const item = this.item ? await service.readOne(this.item) : await service.readSingleton({});

			this.changes = Object.fromEntries(
				Object.entries(this.changes).filter(([key, value]) => !isEqual(item[key], value)),
			);

			for (const client of this.clients) {
				if (client.accountability?.user === accountability?.user) continue;

				this.send(client, {
					action: ACTION.SERVER.SAVE,
				});
			}
		});
	}

	hasClient(client: WebSocketClient) {
		return this.clients.findIndex((c) => c.uid === client.uid) !== -1;
	}

	async join(client: WebSocketClient) {
		if (!this.hasClient(client)) {
			const clientColor = COLORS[random(COLORS.length - 1)]!;
			this.clientColors[client.uid] = clientColor;

			this.sendAll({
				action: ACTION.SERVER.JOIN,
				user: client.accountability!.user!,
				connection: client.uid,
				color: clientColor,
			});

			this.clients.push(client);
		}

		this.send(client, {
			action: ACTION.SERVER.INIT,
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
				user: client.accountability!.user!,
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
			action: ACTION.SERVER.LEAVE,
			connection: client.uid,
		});
	}

	save(sender: WebSocketClient) {
		this.changes = {};

		this.sendExcluding(
			{
				action: ACTION.SERVER.SAVE,
			},
			sender,
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
					accountability: client.accountability!,
				},
			);

			if (field in item) {
				this.send(client, {
					action: ACTION.SERVER.UPDATE,
					field,
					changes: item[field],
				});
			}
		}
	}

	async unset(field: string) {
		delete this.changes[field];

		for (const c of this.clients) {
			if (field && !(await hasFieldPermision(c.accountability!, this.collection, field))) continue;

			this.send(c, {
				action: ACTION.SERVER.UPDATE,
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
			if (field && !(await hasFieldPermision(client.accountability!, this.collection, field))) continue;

			this.send(client, {
				action: ACTION.SERVER.FOCUS,
				connection: sender.uid,
				field,
			});
		}
	}

	sendAll(message: BaseServerMessage) {
		const msg = JSON.stringify({ ...message, type: WS_TYPE.COLLAB, room: this.uid });

		for (const client of this.clients) {
			client.send(msg);
		}
	}

	sendExcluding(message: BaseServerMessage, exclude: WebSocketClient) {
		const msg = JSON.stringify({ ...message, type: WS_TYPE.COLLAB, room: this.uid });

		for (const client of this.clients) {
			if (client.uid !== exclude.uid) client.send(msg);
		}
	}

	send(client: WebSocketClient, message: BaseServerMessage) {
		const msg = JSON.stringify({ ...message, type: WS_TYPE.COLLAB, room: this.uid });
		client.send(msg);
	}
}

export function getRoomHash(collection: string, item: string | number | null, version: string | null) {
	return createHash('sha256').update([collection, item, version].join('-')).digest('hex');
}

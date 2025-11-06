import { COLLAB, type ClientBaseCollabMessage, type Item, type WebSocketClient } from '@directus/types';
import { createHash } from 'crypto';

export class CollabRooms {
	rooms: Record<string, Room> = {};

	createRoom(collection: string, item: string | number, version: string | undefined, initialChanges?: Item) {
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
		return Object.values(this.rooms).filter((room) => room.clients.has(client));
	}
}

export class Room {
	uid: string;
	collection: string;
	item: string | number;
	version: string | undefined;
	changes: Item;
	clients: Set<WebSocketClient> = new Set();
	focuses: Record<string, string> = {};

	constructor(
		uid: string,
		collection: string,
		item: string | number,
		version: string | undefined,
		initialChanges?: Item,
	) {
		this.uid = uid;
		this.collection = collection;
		this.item = item;
		this.version = version;
		this.changes = initialChanges ?? {};
	}

	join(client: WebSocketClient) {
		if (this.clients.has(client)) return;

		this.sendAll({
			action: 'join',
			user: client.accountability!.user!,
		});

		const users: Set<string> = new Set();

		for (const client of this.clients) {
			users.add(client.accountability!.user!);
		}

		this.send(client, {
			action: 'init',
			changes: this.changes,
			focuses: this.focuses,
			users: Array.from(users),
		});

		this.clients.add(client);

		client.on('close', () => {
			this.leave(client);
		});
	}

	leave(client: WebSocketClient) {
		if (!this.clients.has(client)) return;

		this.clients.delete(client);

		this.sendAll({
			action: 'leave',
			user: client.accountability!.user!,
		});
	}

	save(sender: WebSocketClient) {
		this.changes = {};

		this.sendExcluding(
			{
				action: 'save',
			},
			sender,
		);
	}

	update(field: string, changes: unknown) {
		this.changes[field] = changes;

		this.sendAll({
			action: 'update',
			field: field,
			changes: this.changes[field],
		});
	}

	unset(field: string) {
		delete this.changes[field];

		this.sendAll({
			action: 'update',
			field: field,
		});
	}

	focus(client: WebSocketClient, field: string | null) {
		if (!field) {
			this.focuses = Object.fromEntries(
				Object.entries(this.focuses).filter(([_, user]) => user !== client.accountability!.user),
			);
		} else {
			this.focuses[field] = client.accountability!.user!;
		}

		this.sendAll({
			action: 'focus',
			user: client.accountability!.user!,
			field,
		});
	}

	sendAll(message: ClientBaseCollabMessage) {
		const msg = JSON.stringify({ ...message, type: COLLAB, room: this.uid });

		for (const client of this.clients) {
			client.send(msg);
		}
	}

	sendExcluding(message: ClientBaseCollabMessage, exclude: WebSocketClient) {
		const msg = JSON.stringify({ ...message, type: COLLAB, room: this.uid });

		for (const client of this.clients) {
			console.log(client.uid, exclude.uid, client.uid !== exclude.uid);
			if (client.uid !== exclude.uid) client.send(msg);
		}
	}

	send(client: WebSocketClient, message: ClientBaseCollabMessage) {
		const msg = JSON.stringify({ ...message, type: COLLAB, room: this.uid });
		client.send(msg);
	}
}

export function getRoomHash(collection: string, item: string | number, version?: string) {
	return createHash('sha256').update([collection, item, version].join('-')).digest('hex');
}

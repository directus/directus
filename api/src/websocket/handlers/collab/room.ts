import {
	COLLAB,
	COLLAB_COLORS,
	type ClientBaseCollabMessage,
	type ClientID,
	type CollabColor,
	type Item,
	type WebSocketClient,
} from '@directus/types';
import { createHash } from 'crypto';
import { random } from 'lodash-es';

export class CollabRooms {
	rooms: Record<string, Room> = {};

	createRoom(collection: string, item: string | number, version: string | undefined, initialChanges?: Item) {
		console.log('get room', collection, item, version);
		const uid = getRoomHash(collection, item, version);

		if (!(uid in this.rooms)) {
			this.rooms[uid] = new Room(uid, collection, item, version, initialChanges);
			console.log('Room Created', this.rooms[uid]);
		}

		console.log(this.rooms);

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
				console.log('Delete Room', room.uid);
				delete this.rooms[room.uid];
			}
		}
	}
}

export class Room {
	uid: string;
	collection: string;
	item: string | number;
	version: string | undefined;
	changes: Item;
	clients: WebSocketClient[] = [];
	clientColors: Record<ClientID, CollabColor> = {};
	focuses: Record<string, ClientID> = {};

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

	hasClient(client: WebSocketClient) {
		return this.clients.findIndex((c) => c.uid === client.uid) !== -1;
	}

	join(client: WebSocketClient) {
		if (this.hasClient(client)) return;

		const clientColor = COLLAB_COLORS[random(COLLAB_COLORS.length - 1)]!;

		this.clientColors[client.uid] = clientColor;

		this.sendAll({
			action: 'join',
			user: client.accountability!.user!,
			connection: client.uid,
			color: clientColor,
		});

		this.clients.push(client);

		this.send(client, {
			action: 'init',
			changes: this.changes,
			focuses: this.focuses,
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

		this.clients = this.clients.filter((c) => c.uid === client.uid);

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
			this.focuses = Object.fromEntries(Object.entries(this.focuses).filter(([_, user]) => user !== client.uid));
		} else {
			this.focuses[field] = client.uid;
		}

		this.sendAll({
			action: 'focus',
			connection: client.uid,
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

import { randomUUID } from 'crypto';
import { useEnv } from '@directus/env';
import { isDirectusError } from '@directus/errors';
import type { Bus } from '@directus/memory';
import { type WebSocketClient, WS_TYPE } from '@directus/types';
import {
	ACTION,
	type BroadcastMessage,
	type ClientID,
	COLLAB_BUS,
	type ServerError,
	type ServerMessage,
} from '@directus/types/collab';
import { useBus } from '../../../bus/index.js';
import { useLogger } from '../../../logger/index.js';
import { useStore } from './store.js';

const env = useEnv();

const INSTANCE_TIMEOUT = Number(env['WEBSOCKETS_COLLAB_INSTANCE_TIMEOUT']);

type Instance = {
	clients: ClientID[];
	rooms: string[];
};

type Registry = Record<string, Instance>;

type RegistrySnapshot = {
	inactive: Instance;
	active: ClientID[];
};

type RoomMessage = Extract<BroadcastMessage, { type: 'room' }>;

export type RoomListener = (message: RoomMessage) => void;
export class Messenger {
	uid;
	store;
	clients: Record<ClientID, WebSocketClient> = {};
	orders: Record<ClientID, number> = {};
	messenger: Bus = useBus();
	roomListeners: Record<string, RoomListener> = {};

	constructor() {
		this.uid = randomUUID();
		this.store = useStore<{ instances: Registry }>('registry');

		this.store(async (store) => {
			const instances = (await store.get('instances')) ?? {};
			instances[this.uid] = { clients: [], rooms: [] };
			await store.set('instances', instances);
		});

		this.messenger.subscribe(COLLAB_BUS, (message: BroadcastMessage) => {
			if (message.type === 'send') {
				const client = this.clients[message.client];

				if (client) {
					const order = this.orders[client.uid];
					this.orders[client.uid]!++;
					client.send(JSON.stringify({ ...message.message, order }));
				}
			} else if (message.type === 'room') {
				this.roomListeners[message.room]?.(message);
			} else if (message.type === 'ping' && message.instance === this.uid) {
				this.messenger.publish(COLLAB_BUS, { type: 'pong', instance: this.uid });
			}
		});
	}

	setRoomListener(room: string, callback: RoomListener) {
		this.roomListeners[room] = callback;
	}

	removeRoomListener(room: string) {
		delete this.roomListeners[room];
	}

	addClient(client: WebSocketClient) {
		if (client.uid in this.clients) return;

		this.clients[client.uid] = client;
		this.orders[client.uid] = 0;

		this.store(async (store) => {
			const instances = (await store.get('instances')) ?? {};
			if (!instances[this.uid]) instances[this.uid] = { clients: [], rooms: [] };

			instances[this.uid]!.clients = [...(instances[this.uid]!.clients ?? []), client.uid];

			await store.set('instances', instances);
		});

		client.on('close', () => {
			this.removeClient(client.uid);
		});
	}

	removeClient(uid: ClientID) {
		delete this.clients[uid];
		delete this.orders[uid];

		this.store(async (store) => {
			const instances = (await store.get('instances')) ?? {};

			if (instances[this.uid]) {
				instances[this.uid]!.clients = (instances[this.uid]!.clients ?? []).filter(
					(clientId: ClientID) => clientId !== uid,
				);

				await store.set('instances', instances);
			}
		});
	}

	async registerRoom(uid: string) {
		await this.store(async (store) => {
			const instances = (await store.get('instances')) ?? {};
			if (!instances[this.uid]) instances[this.uid] = { clients: [], rooms: [] };

			if (!instances[this.uid]!.rooms.includes(uid)) {
				instances[this.uid]!.rooms.push(uid);
				await store.set('instances', instances);
			}
		});
	}

	async unregisterRoom(uid: string) {
		await this.store(async (store) => {
			const instances = (await store.get('instances')) ?? {};

			if (instances[this.uid]) {
				instances[this.uid]!.rooms = (instances[this.uid]!.rooms ?? []).filter((roomUid: string) => roomUid !== uid);
				await store.set('instances', instances);
			}
		});
	}

	async getRegistry(): Promise<RegistrySnapshot> {
		const instances = (await this.store(async (store) => await store.get('instances'))) ?? {};

		return {
			inactive: { clients: [], rooms: [] },
			active: Object.values(instances)
				.map((instance) => instance.clients)
				.flat(),
		};
	}

	async pruneDeadInstances(): Promise<RegistrySnapshot> {
		const instances = (await this.store(async (store) => await store.get('instances'))) ?? {};

		const inactiveInstances = new Set(Object.keys(instances));
		inactiveInstances.delete(this.uid);

		const pongCollector = (message: BroadcastMessage) => {
			if (message.type === 'pong') {
				inactiveInstances.delete(message.instance);
			}
		};

		this.messenger.subscribe(COLLAB_BUS, pongCollector);

		for (const instance of inactiveInstances) {
			this.messenger.publish(COLLAB_BUS, { type: 'ping', instance });
		}

		await new Promise((resolve) => {
			setTimeout(resolve, INSTANCE_TIMEOUT);
		});

		this.messenger.unsubscribe(COLLAB_BUS, pongCollector);

		const dead: Instance = { clients: [], rooms: [] };

		if (inactiveInstances.size === 0) {
			return {
				inactive: dead,
				active: Object.values(instances)
					.map((instance) => instance.clients)
					.flat(),
			};
		}

		// Reread state to avoid overwriting updates during the timeout phase
		const current = await this.store(async (store) => {
			const current = (await store.get('instances')) ?? {};
			let changed = false;

			for (const deadId of inactiveInstances) {
				if (current[deadId]) {
					dead.clients.push(...(current[deadId]!.clients ?? []));
					dead.rooms.push(...(current[deadId]!.rooms ?? []));
					delete current[deadId];
					changed = true;
				}
			}

			if (changed) {
				await store.set('instances', current);
			}

			return current;
		});

		return {
			inactive: dead,
			active: Object.values(current)
				.map((instance) => instance.clients)
				.flat(),
		};
	}

	sendRoom(room: string, message: Omit<RoomMessage, 'type' | 'room'>) {
		this.messenger.publish(COLLAB_BUS, { type: 'room', room, message });
	}

	sendClient(client: ClientID, message: Omit<ServerMessage, 'order'>) {
		this.messenger.publish(COLLAB_BUS, { type: 'send', client, message });
	}

	handleError(client: ClientID, error: unknown) {
		let message: ServerError;

		if (isDirectusError(error)) {
			message = {
				action: 'error',
				type: WS_TYPE.COLLAB,
				code: error.code,
				message: error.message,
			};
		} else {
			useLogger().error(`WebSocket unhandled exception ${JSON.stringify({ type: WS_TYPE.COLLAB, error })}`);
			return;
		}

		this.messenger.publish(COLLAB_BUS, {
			type: 'send',
			client,
			message,
		});
	}
}

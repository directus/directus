import { randomUUID } from 'crypto';
import { useEnv } from '@directus/env';
import type { Bus } from '@directus/memory';
import type { WebSocketClient } from '@directus/types';
import { type BroadcastMessage, type ClientID, COLLAB_BUS, type ServerMessage } from '@directus/types/collab';
import { useBus } from '../../../bus/index.js';
import { useStore } from './store.js';

type RoomMessage = Extract<BroadcastMessage, { type: 'room' }>;
type InstanceData = {
	instances: Record<string, ClientID[]>;
};

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
		this.store = useStore<InstanceData>('rooms');

		this.store(async (store) => {
			const instances = (await store.get('instances')) ?? {};
			instances[this.uid] = [];
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

			instances[this.uid] = [...(instances[this.uid] ?? []), client.uid];

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

			instances[this.uid] = (instances[this.uid] ?? []).filter((c) => c !== uid);

			await store.set('instances', instances);
		});
	}

	async removeInvalidClients(): Promise<{ inactive: ClientID[]; active: ClientID[] }> {
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

		const env = useEnv();

		await new Promise((resolve) => {
			setTimeout(resolve, Number(env['WEBSOCKETS_COLLAB_INSTANCE_TIMEOUT']) * 1000);
		});

		this.messenger.unsubscribe(COLLAB_BUS, pongCollector);

		const disconnectedClients: ClientID[] = [];

		if (inactiveInstances.size === 0) {
			return { inactive: [], active: Object.values(instances).flat() };
		}

		// Reread state to avoid overwriting updates during the timeout phase
		const current = await this.store(async (store) => {
			const current = (await store.get('instances')) ?? {};
			let changed = false;

			for (const deadId of inactiveInstances) {
				if (current[deadId]) {
					disconnectedClients.push(...(current[deadId] ?? []));
					delete current[deadId];
					changed = true;
				}
			}

			if (changed) {
				await store.set('instances', current);
			}

			return current;
		});

		return { inactive: disconnectedClients, active: Object.values(current).flat() };
	}

	sendRoom(room: string, message: Omit<RoomMessage, 'type' | 'room'>) {
		this.messenger.publish(COLLAB_BUS, { type: 'room', room, message });
	}

	sendClient(client: ClientID, message: Omit<ServerMessage, 'order'>) {
		this.messenger.publish(COLLAB_BUS, { type: 'send', client, message });
	}
}

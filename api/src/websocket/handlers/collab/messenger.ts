import type { Bus } from '@directus/memory';
import type { WebSocketClient } from '@directus/types';
import { type BroadcastMessage, type ClientID, COLLAB_BUS, type ServerMessage } from '@directus/types/collab';
import { useBus } from '../../../bus/index.js';

type RoomMessage = Extract<BroadcastMessage, { type: 'room' }>;

export type RoomListener = (message: RoomMessage) => void;
export class Messenger {
	clients: Record<ClientID, WebSocketClient> = {};
	orders: Record<ClientID, number> = {};
	messenger: Bus = useBus();
	roomListeners: Record<string, RoomListener> = {};

	constructor() {
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
			}
		});
	}

	setRoomListener(room: string, callback: RoomListener) {
		this.roomListeners[room] = callback;
	}

	addClient(client: WebSocketClient) {
		if (client.uid in this.clients) return;

		this.clients[client.uid] = client;
		this.orders[client.uid] = 0;

		client.on('close', () => {
			this.removeClient(client.uid);
		});
	}

	removeClient(uid: ClientID) {
		delete this.clients[uid];
		delete this.orders[uid];
	}

	sendRoom(room: string, message: Omit<RoomMessage, 'type' | 'room'>) {
		this.messenger.publish(COLLAB_BUS, { type: 'room', room, message });
	}

	sendClient(client: ClientID, message: Omit<ServerMessage, 'order'>) {
		this.messenger.publish(COLLAB_BUS, { type: 'send', client, message });
	}
}

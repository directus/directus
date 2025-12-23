import type { Bus } from '@directus/memory';
import { useBus } from '../../../bus/index.js';
import { COLLAB_BUS, type BroadcastMessage, type ClientID, type ServerMessage } from '@directus/types/collab';
import type { WebSocketClient } from '@directus/types';

type RoomMessage = Extract<BroadcastMessage, { type: 'room' }>;

export type RoomListener = (message: RoomMessage) => void;
export class Messenger {
	clients: Record<ClientID, WebSocketClient> = {};
	messenger: Bus = useBus();
	roomListeners: Record<string, RoomListener> = {};

	constructor() {
		this.messenger.subscribe(COLLAB_BUS, (message: BroadcastMessage) => {
			if (message.type === 'send') {
				const client = this.clients[message.client];
				if (client) client.send(JSON.stringify(message.message));
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

		client.on('close', () => {
			delete this.clients[client.uid];
		});
	}

	sendRoom(room: string, message: Omit<RoomMessage, 'type' | 'room'>) {
		this.messenger.publish(COLLAB_BUS, { type: 'room', room, message });
	}

	sendClient(client: ClientID, message: ServerMessage) {
		this.messenger.publish(COLLAB_BUS, { type: 'send', client, message });
	}
}

import type { Bus } from '@directus/memory';
import { useBus } from '../../../bus/index.js';
import {
	COLLAB,
	type BroadcastMessage,
	type ClientCollabMessage,
	type ClientID,
	type WebSocketClient,
} from '@directus/types';

type RoomMessage = Extract<BroadcastMessage, { type: 'room' }>;

export type RoomListener = (message: RoomMessage) => void;
export class Messenger {
	clients: Record<ClientID, WebSocketClient> = {};
	messenger: Bus = useBus();
	roomListeners: Record<string, RoomListener> = {};

	constructor() {
		this.messenger.subscribe(COLLAB, (message: BroadcastMessage) => {
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
		this.messenger.publish(COLLAB, { type: 'room', room, message });
	}

	sendClient(client: ClientID, message: ClientCollabMessage) {
		this.messenger.publish(COLLAB, { type: 'send', client, message });
	}
}

import type { Bus } from '@directus/memory';
import { useBus } from '../../../bus/index.js';
import {
	COLLAB,
	type BroadcastMessage,
	type ClientCollabMessage,
	type ClientID,
	type WebSocketClient,
} from '@directus/types';

export class Messenger {
	clients: Record<ClientID, WebSocketClient> = {};
	messenger: Bus = useBus();

	constructor() {
		this.messenger.subscribe(COLLAB, (message: BroadcastMessage) => {
			const client = this.clients[message.client];
			if (client) client.send(JSON.stringify(message.message));
		});
	}

	addClient(client: WebSocketClient) {
		if (client.uid in this.clients) return;

		this.clients[client.uid] = client;

		client.on('close', () => {
			delete this.clients[client.uid];
		});
	}

	send(client: ClientID, message: ClientCollabMessage) {
		this.messenger.publish(COLLAB, { client, message });
	}
}

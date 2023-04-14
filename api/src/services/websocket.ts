import type { ActionHandler } from '@directus/types';
import { getWebSocketController } from '../websocket/controllers/index.js';
import type { WebSocketController } from '../websocket/controllers/rest.js';
import type { WebSocketClient } from '../websocket/types.js';
import type { WebSocketMessage } from '../websocket/messages.js';
import emitter from '../emitter.js';

export class WebSocketService {
	private controller: WebSocketController;

	constructor() {
		this.controller = getWebSocketController();
	}

	on(event: 'connect' | 'message' | 'error' | 'close', callback: ActionHandler) {
		emitter.onAction('websocket.' + event, callback);
	}

	off(event: 'connect' | 'message' | 'error' | 'close', callback: ActionHandler) {
		emitter.offAction('websocket.' + event, callback);
	}

	broadcast(message: string | WebSocketMessage, filter?: { user?: string; role?: string }) {
		this.controller.clients.forEach((client: WebSocketClient) => {
			if (filter && filter.user && filter.user !== client.accountability?.user) return;
			if (filter && filter.role && filter.role !== client.accountability?.role) return;
			client.send(typeof message === 'string' ? message : JSON.stringify(message));
		});
	}

	clients(): Set<WebSocketClient> {
		return this.controller.clients;
	}
}

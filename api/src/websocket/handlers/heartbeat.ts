import emitter from '../../emitter';
import { fmtMessage, getMessageType } from '../utils/message';
import type { WebSocketClient } from '../types';
import { WebsocketController, getWebsocketController } from '../controllers';
import type { ActionHandler } from '@directus/shared/types';
import { WebSocketMessage } from '../messages';
import env from '../../env';

const HEARTBEAT_FREQUENCY = Number(env['WEBSOCKETS_HEARTBEAT_FREQUENCY']) * 1000;

export class HeartbeatHandler {
	private pulse: NodeJS.Timer | undefined;
	private controller: WebsocketController;

	constructor(controller?: WebsocketController) {
		this.controller = controller ?? getWebsocketController();
		emitter.onAction('websocket.message', ({ client, message }) => {
			try {
				this.onMessage(client, WebSocketMessage.parse(message));
			} catch {
				/* ignore errors */
			}
		});
		emitter.onAction('websocket.connect', () => this.checkClients());
		emitter.onAction('websocket.error', () => this.checkClients());
		emitter.onAction('websocket.close', () => this.checkClients());
	}
	private checkClients() {
		const hasClients = this.controller.clients.size > 0;
		if (hasClients && !this.pulse) {
			this.pulse = setInterval(() => {
				this.pingClients();
			}, HEARTBEAT_FREQUENCY);
		}
		if (!hasClients && this.pulse) {
			clearInterval(this.pulse);
			this.pulse = undefined;
		}
	}
	onMessage(client: WebSocketClient, message: WebSocketMessage) {
		if (getMessageType(message) !== 'ping') return;
		// send pong message back as acknowledgement
		const data = 'uid' in message ? { uid: message.uid } : {};
		client.send(fmtMessage('pong', data));
	}
	pingClients() {
		const pendingClients = new Set<WebSocketClient>(this.controller.clients);
		const activeClients = new Set<WebSocketClient>();
		const timeout = setTimeout(() => {
			// close connections that haven't responded
			for (const client of pendingClients) {
				client.close();
			}
		}, HEARTBEAT_FREQUENCY);
		const messageWatcher: ActionHandler = ({ client }) => {
			// any message means this connection is still open
			if (!activeClients.has(client)) {
				pendingClients.delete(client);
				activeClients.add(client);
			}
			if (pendingClients.size === 0) {
				clearTimeout(timeout);
				emitter.offAction('websocket.message', messageWatcher);
			}
		};
		emitter.onAction('websocket.message', messageWatcher);
		// ping all the clients
		for (const client of pendingClients) {
			client.send(fmtMessage('ping'));
		}
	}
}

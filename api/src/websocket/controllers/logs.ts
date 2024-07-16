import { useEnv } from '@directus/env';
import type { Server as httpServer } from 'http';
import type WebSocket from 'ws';
import emitter from '../../emitter.js';
import { useLogger } from '../../logger/index.js';
import { refreshAccountability } from '../authenticate.js';
import { handleWebSocketError } from '../errors.js';
import { WebSocketMessage } from '../messages.js';
import type { AuthenticationState, WebSocketClient } from '../types.js';
import SocketController from './base.js';

const logger = useLogger();

export class LogsController extends SocketController {
	constructor(httpServer: httpServer) {
		super(httpServer, 'WEBSOCKETS_LOGS');

		const env = useEnv();

		this.server.on('connection', (ws: WebSocket, auth: AuthenticationState) => {
			this.bindEvents(this.createClient(ws, auth));
		});

		logger.info(`Logs WebSocket Server started at ws://${env['HOST']}:${env['PORT']}${this.endpoint}`);
	}

	private bindEvents(client: WebSocketClient) {
		client.on('parsed-message', async (message: WebSocketMessage) => {
			try {
				client.accountability = await refreshAccountability(client.accountability);
				emitter.emitAction('websocket.logs', { message, client });
			} catch (error) {
				handleWebSocketError(client, error, 'server');
				return;
			}
		});

		client.on('error', (event: WebSocket.Event) => {
			emitter.emitAction('websocket.error', { client, event });
		});

		client.on('close', (event: WebSocket.CloseEvent) => {
			emitter.emitAction('websocket.close', { client, event });
		});

		emitter.emitAction('websocket.connect', { client });
	}
}
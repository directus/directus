import type WebSocket from 'ws';
import type { Server as httpServer } from 'http';
import type { AuthenticationState, WebSocketClient } from '../types.js';
import env from '../../env.js';
import SocketController from './base.js';
import emitter from '../../emitter.js';
import { refreshAccountability } from '../authenticate.js';
import { handleWebSocketException, WebSocketException } from '../exceptions.js';
import logger from '../../logger.js';
import { WebSocketMessage } from '../messages.js';
import { parseJSON } from '@directus/utils';

export class WebSocketController extends SocketController {
	constructor(httpServer: httpServer) {
		super(httpServer, 'WEBSOCKETS_REST');
		this.server.on('connection', (ws: WebSocket, auth: AuthenticationState) => {
			this.bindEvents(this.createClient(ws, auth));
		});
		logger.info(`WebSocket Server started at ws://${env['HOST']}:${env['PORT']}${this.endpoint}`);
	}
	private bindEvents(client: WebSocketClient) {
		client.on('parsed-message', async (message: WebSocketMessage) => {
			try {
				message = WebSocketMessage.parse(await emitter.emitFilter('websocket.message', message, { client }));
				client.accountability = await refreshAccountability(client.accountability);
				emitter.emitAction('websocket.message', { message, client });
			} catch (error) {
				handleWebSocketException(client, error, 'server');
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
	protected override parseMessage(data: string): WebSocketMessage {
		let message: WebSocketMessage;
		try {
			message = parseJSON(data);
		} catch (err: any) {
			throw new WebSocketException('server', 'INVALID_PAYLOAD', 'Unable to parse the incoming message.');
		}
		return message;
	}
}

import type WebSocket from 'ws';
import type { Server as httpServer } from 'http';
import type { AuthenticationState, WebSocketClient, WebSocketMessage } from '../types';
import env from '../../env';
import SocketController from './base';
import emitter from '../../emitter';
import { refreshAccountability } from '../authenticate';
import { handleWebsocketException, WebSocketException } from '../exceptions';
import logger from '../../logger';
import { trimUpper } from '../utils/message';

export class WebsocketController extends SocketController {
	constructor(httpServer: httpServer) {
		super(httpServer, 'WS REST', env['WEBSOCKETS_REST_PATH'], {
			mode: env['WEBSOCKETS_REST_AUTH'],
			timeout: env['WEBSOCKETS_REST_AUTH_TIMEOUT'] * 10000,
			verbose: true,
		});
		this.server.on('connection', (ws: WebSocket, auth: AuthenticationState) => {
			this.bindEvents(this.createClient(ws, auth));
		});
		logger.info(`Websocket available at ws://${env['HOST']}:${env['PORT']}${this.endpoint}`);
	}
	private bindEvents(client: WebSocketClient) {
		client.on('parsed-message', async (message: WebSocketMessage) => {
			try {
				message = await emitter.emitFilter('websocket.message', message, { client });
				client.accountability = await refreshAccountability(client.accountability);
				emitter.emitAction('websocket.message', { message, client });
			} catch (error) {
				handleWebsocketException(client, error);
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
			message = JSON.parse(data);
			message.type = trimUpper(message.type);
		} catch (err: any) {
			throw new WebSocketException('server', 'INVALID_PAYLOAD', 'Unable to parse the incoming message!');
		}
		return message;
	}
}

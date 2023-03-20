import type WebSocket from 'ws';
import type { Server as httpServer } from 'http';
import type { AuthenticationState, AuthMode, WebSocketClient } from '../types';
import env from '../../env';
import SocketController from './base';
import emitter from '../../emitter';
import { refreshAccountability } from '../authenticate';
import { handleWebsocketException, WebSocketException } from '../exceptions';
import logger from '../../logger';
import { WebSocketMessage } from '../messages';
import { parseJSON } from '@directus/shared/utils';

export class WebsocketController extends SocketController {
	constructor(httpServer: httpServer) {
		super(httpServer, 'WS REST', String(env.WEBSOCKETS_REST_PATH), {
			mode: String(env.WEBSOCKETS_REST_AUTH).toLowerCase() as AuthMode,
			timeout: Number(env.WEBSOCKETS_REST_AUTH_TIMEOUT) * 1000,
		});
		if ('WEBSOCKETS_REST_CONN_LIMIT' in env) {
			this.maxConnections = Number(env.WEBSOCKETS_REST_CONN_LIMIT);
		}
		this.server.on('connection', (ws: WebSocket, auth: AuthenticationState) => {
			this.bindEvents(this.createClient(ws, auth));
		});
		logger.info(`Websocket Server started at ws://${env.HOST}:${env.PORT}${this.endpoint}`);
	}
	private bindEvents(client: WebSocketClient) {
		client.on('parsed-message', async (message: WebSocketMessage) => {
			try {
				message = WebSocketMessage.parse(await emitter.emitFilter('websocket.message', message, { client }));
				client.accountability = await refreshAccountability(client.accountability);
				emitter.emitAction('websocket.message', { message, client });
			} catch (error) {
				handleWebsocketException(client, error, 'server');
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

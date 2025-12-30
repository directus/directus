import emitter from '../../emitter.js';
import { useLogger } from '../../logger/index.js';
import { getAddress } from '../../utils/get-address.js';
import { handleWebSocketError, WebSocketError } from '../errors.js';
import type { AuthenticationState, WebSocketClient } from '../types.js';
import SocketController from './base.js';
import { registerWebSocketEvents } from './hooks.js';
import { WebSocketMessage } from '@directus/types';
import { parseJSON } from '@directus/utils';
import type { Server as httpServer } from 'http';
import type WebSocket from 'ws';

const logger = useLogger();

export class WebSocketController extends SocketController {
	constructor(httpServer: httpServer) {
		super(httpServer, 'WEBSOCKETS_REST');
		registerWebSocketEvents();

		this.server.on('connection', (ws: WebSocket, auth: AuthenticationState) => {
			this.bindEvents(this.createClient(ws, auth));
		});

		logger.info(`WebSocket Server started at ${getAddress(httpServer)}${this.endpoint}`);
	}

	private bindEvents(client: WebSocketClient) {
		client.on('parsed-message', async (message: WebSocketMessage) => {
			try {
				message = WebSocketMessage.parse(await emitter.emitFilter('websocket.message', message, { client }));
				emitter.emitAction('websocket.message', { message, client });
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

	protected override parseMessage(data: string): WebSocketMessage {
		let message: WebSocketMessage;

		try {
			message = parseJSON(data);
		} catch {
			throw new WebSocketError('server', 'INVALID_PAYLOAD', 'Unable to parse the incoming message.');
		}

		return message;
	}
}

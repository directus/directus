import { parseJSON } from '@directus/utils';
import type { Server as httpServer } from 'http';
import type WebSocket from 'ws';
import emitter from '../../emitter.js';
import { useEnv } from '../../env.js';
import { useLogger } from '../../logger.js';
import { refreshAccountability } from '../authenticate.js';
import { WebSocketError, handleWebSocketError } from '../errors.js';
import { WebSocketMessage } from '../messages.js';
import type { AuthenticationState, WebSocketClient } from '../types.js';
import SocketController from './base.js';

const logger = useLogger();

export class WebSocketController extends SocketController {
	constructor(httpServer: httpServer) {
		super(httpServer, 'WEBSOCKETS_REST');

		const env = useEnv();

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
		} catch (err: any) {
			throw new WebSocketError('server', 'INVALID_PAYLOAD', 'Unable to parse the incoming message.');
		}

		return message;
	}
}

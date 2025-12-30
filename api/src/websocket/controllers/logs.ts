import emitter from '../../emitter.js';
import { useLogger } from '../../logger/index.js';
import { handleWebSocketError, WebSocketError } from '../errors.js';
import { AuthMode } from '../messages.js';
import type { AuthenticationState, WebSocketClient } from '../types.js';
import SocketController from './base.js';
import { useEnv } from '@directus/env';
import type { WebSocketMessage } from '@directus/types';
import type { Accountability } from '@directus/types';
import type { Server as httpServer } from 'http';
import type WebSocket from 'ws';

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

	override getEnvironmentConfig(configPrefix: string) {
		const env = useEnv();

		const endpoint = String(env[`${configPrefix}_PATH`]);

		const maxConnections =
			`${configPrefix}_CONN_LIMIT` in env ? Number(env[`${configPrefix}_CONN_LIMIT`]) : Number.POSITIVE_INFINITY;

		return {
			endpoint,
			maxConnections,
			authentication: {
				mode: 'strict' as AuthMode,
				timeout: 0,
			},
		};
	}

	private bindEvents(client: WebSocketClient) {
		client.on('parsed-message', async (message: WebSocketMessage) => {
			try {
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

	protected override checkUserRequirements(accountability: Accountability | null) {
		// enforce admin only access for the logs streaming websocket
		if (!accountability?.admin) {
			throw new WebSocketError('auth', 'AUTH_FAILED', 'Unauthorized access.');
		}
	}
}

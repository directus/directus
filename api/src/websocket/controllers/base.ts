import type { Accountability } from '@directus/shared/types';
import type { IncomingMessage, Server as httpServer } from 'http';
import type { RateLimiterAbstract } from 'rate-limiter-flexible';
import type { ParsedUrlQuery } from 'querystring';
import WebSocket, { WebSocketServer } from 'ws';
import type internal from 'stream';
import { v4 as uuid } from 'uuid';
import { parse } from 'url';
import logger from '../../logger';
import { getAccountabilityForToken } from '../../utils/get-accountability-for-token';
import { getExpiresAtForToken } from '../utils/get-expires-at-for-token';
import { authenticateConnection, authenticationSuccess } from '../authenticate';
import type { AuthenticationState, AuthMode, UpgradeContext, WebSocketClient } from '../types';
import { waitForAnyMessage, waitForMessageType } from '../utils/wait-for-message';
import { TokenExpiredException } from '../../exceptions';
import { handleWebsocketException, WebSocketException } from '../exceptions';
import emitter from '../../emitter';
import { createRateLimiter } from '../../rate-limiter';
import { WebSocketAuthMessage, WebSocketMessage } from '../messages';
import { parseJSON } from '@directus/shared/utils';
import { getMessageType } from '../utils/message';
import env, { toBoolean } from '../../env';

export default abstract class SocketController {
	name: string;
	server: WebSocket.Server;
	clients: Set<WebSocketClient>;
	authentication: {
		mode: AuthMode;
		timeout: number;
		verbose: boolean;
	};
	endpoint: string;
	maxConnections: number;
	private authTimer: NodeJS.Timer | null;
	private rateLimiter: RateLimiterAbstract | null;

	constructor(
		httpServer: httpServer,
		name: string,
		endpoint: string,
		authentication: {
			mode: AuthMode;
			timeout: number;
			verbose: boolean;
		}
	) {
		this.server = new WebSocketServer({ noServer: true });
		this.clients = new Set();
		this.authTimer = null;
		this.name = name;
		this.endpoint = endpoint;
		this.authentication = authentication;
		this.rateLimiter =
			toBoolean(env.RATE_LIMITER_ENABLED) === true
				? createRateLimiter('RATE_LIMITER', {
						keyPrefix: 'websocket',
				  })
				: null;
		this.maxConnections = Number.POSITIVE_INFINITY;
		httpServer.on('upgrade', this.handleUpgrade.bind(this));
	}
	protected async handleUpgrade(request: IncomingMessage, socket: internal.Duplex, head: Buffer) {
		const { pathname, query } = parse(request.url!, true);
		if (pathname !== this.endpoint) return;
		if (this.clients.size >= this.maxConnections) {
			logger.debug('Websocket upgrade denied - max connections reached');
			socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
			socket.destroy();
			return;
		}
		const context: UpgradeContext = { request, socket, head };
		if (this.authentication.mode === 'strict') {
			await this.handleStrictUpgrade(context, query);
			return;
		}
		if (this.authentication.mode === 'handshake') {
			await this.handleHandshakeUpgrade(context);
			return;
		}
		this.server.handleUpgrade(request, socket, head, async (ws) => {
			const state = { accountability: null, expiresAt: null } as AuthenticationState;
			this.server.emit('connection', ws, state);
		});
	}
	protected async handleStrictUpgrade({ request, socket, head }: UpgradeContext, query: ParsedUrlQuery) {
		let accountability: Accountability | null, expiresAt: number | null;
		try {
			const token = query['access_token'] as string;
			accountability = await getAccountabilityForToken(token);
			expiresAt = getExpiresAtForToken(token);
		} catch {
			accountability = null;
			expiresAt = null;
		}
		if (!accountability || !accountability.user) {
			logger.debug('Websocket upgrade denied - ' + JSON.stringify(accountability || 'invalid'));
			socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
			socket.destroy();
			return;
		}
		this.server.handleUpgrade(request, socket, head, async (ws) => {
			const state = { accountability, expiresAt } as AuthenticationState;
			this.server.emit('connection', ws, state);
		});
	}
	protected async handleHandshakeUpgrade({ request, socket, head }: UpgradeContext) {
		this.server.handleUpgrade(request, socket, head, async (ws) => {
			try {
				const payload = await waitForAnyMessage(ws, this.authentication.timeout);
				if (getMessageType(payload) !== 'auth') throw new Error();

				const state = await authenticateConnection(WebSocketAuthMessage.parse(payload));
				ws.send(authenticationSuccess(payload['uid']));
				this.server.emit('connection', ws, state);
			} catch {
				logger.debug('Websocket authentication handshake failed');
				const error = new WebSocketException('auth', 'AUTH_FAILED', 'Authentication handshake failed.');
				handleWebsocketException(ws, error, 'auth');
				ws.close();
			}
		});
	}
	createClient(ws: WebSocket, { accountability, expiresAt }: AuthenticationState) {
		const client = ws as WebSocketClient;
		client.accountability = accountability;
		client.expiresAt = expiresAt;
		client.uid = uuid();

		ws.on('message', async (data: WebSocket.RawData) => {
			if (this.rateLimiter !== null) {
				try {
					await this.rateLimiter.consume(client.uid);
				} catch (limit) {
					const timeout = (limit as any)?.msBeforeNext ?? this.rateLimiter.msDuration;
					const error = new WebSocketException(
						'server',
						'REQUESTS_EXCEEDED',
						`Too many messages, retry after ${timeout}ms.`
					);
					handleWebsocketException(client, error, 'server');
					logger.debug(`Websocket#${client.uid} is rate limited`);
					return;
				}
			}
			let message: WebSocketMessage;
			try {
				message = this.parseMessage(data.toString());
			} catch (err: any) {
				handleWebsocketException(client, err, 'server');
				return;
			}
			logger.trace(`Websocket#${client.uid} - ${JSON.stringify(message)}`);
			if (getMessageType(message) === 'auth') {
				try {
					await this.handleAuthRequest(client, WebSocketAuthMessage.parse(message));
				} catch {
					// ignore errors
				}
				return;
			}
			ws.emit('parsed-message', message);
		});
		ws.on('error', () => {
			logger.debug(`Websocket#${client.uid} connection errored`);
			if (this.authTimer) {
				clearTimeout(this.authTimer);
				this.authTimer = null;
			}
			this.clients.delete(client);
		});
		ws.on('close', () => {
			logger.debug(`Websocket#${client.uid} connection closed`);
			if (this.authTimer) {
				clearTimeout(this.authTimer);
				this.authTimer = null;
			}
			this.clients.delete(client);
		});
		logger.debug(
			`Websocket#${client.uid} connected ${accountability ? JSON.stringify(accountability) : 'without authentication'}`
		);
		this.setTokenExpireTimer(client);
		this.clients.add(client);
		return client;
	}
	protected parseMessage(data: string): WebSocketMessage {
		let message: WebSocketMessage;
		try {
			message = WebSocketMessage.parse(parseJSON(data));
		} catch (err: any) {
			throw new WebSocketException('server', 'INVALID_PAYLOAD', 'Unable to parse the incoming message.');
		}
		return message;
	}
	protected async handleAuthRequest(client: WebSocketClient, message: WebSocketAuthMessage) {
		try {
			const { accountability, expiresAt } = await authenticateConnection(message);
			client.accountability = accountability;
			client.expiresAt = expiresAt;
			this.setTokenExpireTimer(client);
			emitter.emitAction('websocket.auth.success', { client });
			if (this.authentication.verbose) {
				client.send(authenticationSuccess(message.uid));
			}
			logger.debug(`Websocket#${client.uid} authenticated ${JSON.stringify(client.accountability)}`);
		} catch (error) {
			logger.debug(`Websocket#${client.uid} failed authentication`);
			emitter.emitAction('websocket.auth.failure', { client });

			client.accountability = null;
			client.expiresAt = null;
			const _error =
				error instanceof WebSocketException
					? error
					: new WebSocketException('auth', 'AUTH_FAILED', 'Authentication failed.', message.uid);
			handleWebsocketException(client, _error, 'auth');
		}
	}
	setTokenExpireTimer(client: WebSocketClient) {
		if (this.authTimer) {
			clearTimeout(this.authTimer);
			this.authTimer = null;
		}
		if (!client.expiresAt) return;
		const expiresIn = client.expiresAt * 1000 - Date.now();
		this.authTimer = setTimeout(() => {
			client.accountability = null;
			client.expiresAt = null;
			handleWebsocketException(client, new TokenExpiredException(), 'auth');
			waitForMessageType(client, 'AUTH', this.authentication.timeout).catch((msg: WebSocketMessage) => {
				const error = new WebSocketException('auth', 'AUTH_TIMEOUT', 'Authentication timed out.', msg?.uid);
				handleWebsocketException(client, error, 'auth');
				if (this.authentication.mode !== 'public') {
					client.close();
				}
			});
		}, expiresIn);
	}
	terminate() {
		this.server.clients.forEach((ws) => {
			ws.terminate();
		});
	}
}

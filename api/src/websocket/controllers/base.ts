import type { Accountability } from '@directus/types';
import { parseJSON } from '@directus/utils';
import type { IncomingMessage, Server as httpServer } from 'http';
import type { ParsedUrlQuery } from 'querystring';
import type { RateLimiterAbstract } from 'rate-limiter-flexible';
import type internal from 'stream';
import { parse } from 'url';
import { v4 as uuid } from 'uuid';
import WebSocket, { WebSocketServer } from 'ws';
import { fromZodError } from 'zod-validation-error';
import emitter from '../../emitter.js';
import env from '../../env.js';
import { InvalidConfigException, TokenExpiredException } from '../../exceptions/index.js';
import logger from '../../logger.js';
import { createRateLimiter } from '../../rate-limiter.js';
import { getAccountabilityForToken } from '../../utils/get-accountability-for-token.js';
import { toBoolean } from '../../utils/to-boolean.js';
import { authenticateConnection, authenticationSuccess } from '../authenticate.js';
import { WebSocketException, handleWebSocketException } from '../exceptions.js';
import { AuthMode, WebSocketAuthMessage, WebSocketMessage } from '../messages.js';
import type { AuthenticationState, UpgradeContext, WebSocketClient } from '../types.js';
import { getExpiresAtForToken } from '../utils/get-expires-at-for-token.js';
import { getMessageType } from '../utils/message.js';
import { waitForAnyMessage, waitForMessageType } from '../utils/wait-for-message.js';
import { registerWebSocketEvents } from './hooks.js';

const TOKEN_CHECK_INTERVAL = 15 * 60 * 1000; // 15 minutes

export default abstract class SocketController {
	server: WebSocket.Server;
	clients: Set<WebSocketClient>;
	authentication: {
		mode: AuthMode;
		timeout: number;
	};

	endpoint: string;
	maxConnections: number;
	private rateLimiter: RateLimiterAbstract | null;
	private authInterval: NodeJS.Timer | null;

	constructor(httpServer: httpServer, configPrefix: string) {
		this.server = new WebSocketServer({ noServer: true });
		this.clients = new Set();
		this.authInterval = null;

		const { endpoint, authentication, maxConnections } = this.getEnvironmentConfig(configPrefix);
		this.endpoint = endpoint;
		this.authentication = authentication;
		this.maxConnections = maxConnections;
		this.rateLimiter = this.getRateLimiter();

		httpServer.on('upgrade', this.handleUpgrade.bind(this));
		this.checkClientTokens();
		registerWebSocketEvents();
	}

	protected getEnvironmentConfig(configPrefix: string): {
		endpoint: string;
		authentication: {
			mode: AuthMode;
			timeout: number;
		};
		maxConnections: number;
	} {
		const endpoint = String(env[`${configPrefix}_PATH`]);
		const authMode = AuthMode.safeParse(String(env[`${configPrefix}_AUTH`]).toLowerCase());
		const authTimeout = Number(env[`${configPrefix}_AUTH_TIMEOUT`]) * 1000;

		const maxConnections =
			`${configPrefix}_CONN_LIMIT` in env ? Number(env[`${configPrefix}_CONN_LIMIT`]) : Number.POSITIVE_INFINITY;

		if (!authMode.success) {
			throw new InvalidConfigException(fromZodError(authMode.error, { prefix: `${configPrefix}_AUTH` }).message);
		}

		return {
			endpoint,
			maxConnections,
			authentication: {
				mode: authMode.data,
				timeout: authTimeout,
			},
		};
	}

	protected getRateLimiter() {
		if (toBoolean(env['RATE_LIMITER_ENABLED']) === true) {
			return createRateLimiter('RATE_LIMITER', {
				keyPrefix: 'websocket',
			});
		}

		return null;
	}

	protected async handleUpgrade(request: IncomingMessage, socket: internal.Duplex, head: Buffer) {
		const { pathname, query } = parse(request.url!, true);
		if (pathname !== this.endpoint) return;

		if (this.clients.size >= this.maxConnections) {
			logger.debug('WebSocket upgrade denied - max connections reached');
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
			const state = { accountability: null, expires_at: null } as AuthenticationState;
			this.server.emit('connection', ws, state);
		});
	}

	protected async handleStrictUpgrade({ request, socket, head }: UpgradeContext, query: ParsedUrlQuery) {
		let accountability: Accountability | null, expires_at: number | null;

		try {
			const token = query['access_token'] as string;
			accountability = await getAccountabilityForToken(token);
			expires_at = getExpiresAtForToken(token);
		} catch {
			accountability = null;
			expires_at = null;
		}

		if (!accountability || !accountability.user) {
			logger.debug('WebSocket upgrade denied - ' + JSON.stringify(accountability || 'invalid'));
			socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
			socket.destroy();
			return;
		}

		this.server.handleUpgrade(request, socket, head, async (ws) => {
			const state = { accountability, expires_at } as AuthenticationState;
			this.server.emit('connection', ws, state);
		});
	}

	protected async handleHandshakeUpgrade({ request, socket, head }: UpgradeContext) {
		this.server.handleUpgrade(request, socket, head, async (ws) => {
			try {
				const payload = await waitForAnyMessage(ws, this.authentication.timeout);
				if (getMessageType(payload) !== 'auth') throw new Error();

				const state = await authenticateConnection(WebSocketAuthMessage.parse(payload));
				ws.send(authenticationSuccess(payload['uid'], state.refresh_token));
				this.server.emit('connection', ws, state);
			} catch {
				logger.debug('WebSocket authentication handshake failed');
				const error = new WebSocketException('auth', 'AUTH_FAILED', 'Authentication handshake failed.');
				handleWebSocketException(ws, error, 'auth');
				ws.close();
			}
		});
	}

	createClient(ws: WebSocket, { accountability, expires_at }: AuthenticationState) {
		const client = ws as WebSocketClient;
		client.accountability = accountability;
		client.expires_at = expires_at;
		client.uid = uuid();
		client.auth_timer = null;

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

					handleWebSocketException(client, error, 'server');
					logger.debug(`WebSocket#${client.uid} is rate limited`);
					return;
				}
			}

			let message: WebSocketMessage;

			try {
				message = this.parseMessage(data.toString());
			} catch (err: any) {
				handleWebSocketException(client, err, 'server');
				return;
			}

			if (getMessageType(message) === 'auth') {
				try {
					await this.handleAuthRequest(client, WebSocketAuthMessage.parse(message));
				} catch {
					// ignore errors
				}

				return;
			}

			// this log cannot be higher in the function or it will leak credentials
			logger.trace(`WebSocket#${client.uid} - ${JSON.stringify(message)}`);
			ws.emit('parsed-message', message);
		});

		ws.on('error', () => {
			logger.debug(`WebSocket#${client.uid} connection errored`);

			if (client.auth_timer) {
				clearTimeout(client.auth_timer);
				client.auth_timer = null;
			}

			this.clients.delete(client);
		});

		ws.on('close', () => {
			logger.debug(`WebSocket#${client.uid} connection closed`);

			if (client.auth_timer) {
				clearTimeout(client.auth_timer);
				client.auth_timer = null;
			}

			this.clients.delete(client);
		});

		logger.debug(`WebSocket#${client.uid} connected`);

		if (accountability) {
			logger.trace(`WebSocket#${client.uid} authenticated as ${JSON.stringify(accountability)}`);
		}

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
			const { accountability, expires_at, refresh_token } = await authenticateConnection(message);
			client.accountability = accountability;
			client.expires_at = expires_at;
			this.setTokenExpireTimer(client);
			emitter.emitAction('websocket.auth.success', { client });
			client.send(authenticationSuccess(message.uid, refresh_token));
			logger.trace(`WebSocket#${client.uid} authenticated as ${JSON.stringify(client.accountability)}`);
		} catch (error) {
			logger.trace(`WebSocket#${client.uid} failed authentication`);
			emitter.emitAction('websocket.auth.failure', { client });

			client.accountability = null;
			client.expires_at = null;

			const _error =
				error instanceof WebSocketException
					? error
					: new WebSocketException('auth', 'AUTH_FAILED', 'Authentication failed.', message.uid);

			handleWebSocketException(client, _error, 'auth');

			if (this.authentication.mode !== 'public') {
				client.close();
			}
		}
	}

	setTokenExpireTimer(client: WebSocketClient) {
		if (client.auth_timer !== null) {
			// clear up old timeouts if needed
			clearTimeout(client.auth_timer);
			client.auth_timer = null;
		}

		if (!client.expires_at) return;

		const expiresIn = client.expires_at * 1000 - Date.now();
		if (expiresIn > TOKEN_CHECK_INTERVAL) return;

		client.auth_timer = setTimeout(() => {
			client.accountability = null;
			client.expires_at = null;
			handleWebSocketException(client, new TokenExpiredException(), 'auth');

			waitForMessageType(client, 'auth', this.authentication.timeout).catch((msg: WebSocketMessage) => {
				const error = new WebSocketException('auth', 'AUTH_TIMEOUT', 'Authentication timed out.', msg?.uid);
				handleWebSocketException(client, error, 'auth');

				if (this.authentication.mode !== 'public') {
					client.close();
				}
			});
		}, expiresIn);
	}

	checkClientTokens() {
		this.authInterval = setInterval(() => {
			if (this.clients.size === 0) return;

			// check the clients and set shorter timeouts if needed
			for (const client of this.clients) {
				if (client.expires_at === null || client.auth_timer !== null) continue;
				this.setTokenExpireTimer(client);
			}
		}, TOKEN_CHECK_INTERVAL);
	}

	terminate() {
		if (this.authInterval) clearInterval(this.authInterval);

		this.clients.forEach((client) => {
			if (client.auth_timer) clearTimeout(client.auth_timer);
		});

		this.server.clients.forEach((ws) => {
			ws.terminate();
		});
	}
}

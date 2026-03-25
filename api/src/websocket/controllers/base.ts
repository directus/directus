import type { Server as httpServer, IncomingMessage } from 'http';
import { randomUUID } from 'node:crypto';
import type internal from 'stream';
import { parse } from 'url';
import { useEnv } from '@directus/env';
import { InvalidProviderConfigError, TokenExpiredError } from '@directus/errors';
import type { Accountability } from '@directus/types';
import { WebSocketMessage } from '@directus/types';
import { parseJSON, toBoolean } from '@directus/utils';
import cookie from 'cookie';
import type { RateLimiterAbstract } from 'rate-limiter-flexible';
import WebSocket, { type Server, WebSocketServer } from 'ws';
import { fromZodError } from 'zod-validation-error';
import emitter from '../../emitter.js';
import { useLogger } from '../../logger/index.js';
import { createDefaultAccountability } from '../../permissions/utils/create-default-accountability.js';
import { createRateLimiter } from '../../rate-limiter.js';
import { getIPFromReq } from '../../utils/get-ip-from-req.js';
import { authenticateConnection, authenticationSuccess } from '../authenticate.js';
import { handleWebSocketError, WebSocketError } from '../errors.js';
import { AuthMode, WebSocketAuthMessage } from '../messages.js';
import type { AuthenticationState, UpgradeContext, WebSocketAuthentication, WebSocketClient } from '../types.js';
import { getMessageType } from '../utils/message.js';
import { waitForAnyMessage, waitForMessageType } from '../utils/wait-for-message.js';

const TOKEN_CHECK_INTERVAL = 15 * 60 * 1000; // 15 minutes

const logger = useLogger();

export default abstract class SocketController {
	server: Server;
	clients: Set<WebSocketClient>;
	authentication: WebSocketAuthentication;

	endpoint: string;
	maxConnections: number;
	private rateLimiter: RateLimiterAbstract | null;
	private authInterval: NodeJS.Timeout | null;

	constructor(httpServer: httpServer, configPrefix: string) {
		this.server = new WebSocketServer({
			noServer: true,
			// @ts-ignore TODO Remove once @types/ws has been updated
			autoPong: false,
		});

		this.clients = new Set();
		this.authInterval = null;

		const { endpoint, authentication, maxConnections } = this.getEnvironmentConfig(configPrefix);
		this.endpoint = endpoint;
		this.authentication = authentication;
		this.maxConnections = maxConnections;
		this.rateLimiter = this.getRateLimiter();

		httpServer.on('upgrade', this.handleUpgrade.bind(this));
		this.checkClientTokens();
	}

	protected getEnvironmentConfig(configPrefix: string): {
		endpoint: string;
		authentication: WebSocketAuthentication;
		maxConnections: number;
	} {
		const env = useEnv();

		const endpoint = String(env[`${configPrefix}_PATH`]);
		const authMode = AuthMode.safeParse(String(env[`${configPrefix}_AUTH`]).toLowerCase());
		const authTimeout = Number(env[`${configPrefix}_AUTH_TIMEOUT`]) * 1000;

		const maxConnections =
			`${configPrefix}_CONN_LIMIT` in env ? Number(env[`${configPrefix}_CONN_LIMIT`]) : Number.POSITIVE_INFINITY;

		if (!authMode.success) {
			throw new InvalidProviderConfigError({
				provider: 'ws',
				reason: fromZodError(authMode.error, { prefix: `${configPrefix}_AUTH` }).message,
			});
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
		const env = useEnv();

		if (toBoolean(env['RATE_LIMITER_ENABLED']) === true) {
			return createRateLimiter('RATE_LIMITER', {
				keyPrefix: 'websocket',
			});
		}

		return null;
	}

	private catchInvalidMessages(ws: WebSocket) {
		/**
		 * This fix was done to prevent the API from crashing on receiving invalid WebSocket frames
		 * https://github.com/directus/directus/security/advisories/GHSA-hmgw-9jrg-hf2m
		 * https://github.com/websockets/ws/issues/2098
		 */
		// @ts-ignore <- required because "_socket" is not typed on WS
		ws._socket.prependListener('data', (data) => data.toString());

		ws.on('error', (error) => {
			if (error.message) logger.debug(error.message);
		});
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

		const env = useEnv();
		const cookies = request.headers.cookie ? cookie.parse(request.headers.cookie) : {};
		const sessionCookieName = env['SESSION_COOKIE_NAME'] as string;

		const accountabilityOverrides: UpgradeContext['accountabilityOverrides'] = {
			ip: getIPFromReq(request) ?? null,
		};

		const userAgent = request.headers['user-agent']?.substring(0, 1024);
		if (userAgent) accountabilityOverrides.userAgent = userAgent;

		const origin = request.headers['origin'];
		if (origin) accountabilityOverrides.origin = origin;
		const context: UpgradeContext = { request, socket, head, accountabilityOverrides };

		if (this.authentication.mode === 'strict' || query['access_token'] || cookies[sessionCookieName]) {
			let token: string | null = null;

			if (typeof query['access_token'] === 'string') {
				token = query['access_token'];
			} else if (typeof cookies[sessionCookieName] === 'string') {
				token = cookies[sessionCookieName] ?? null;
			}

			await this.handleTokenUpgrade(context, token);
			return;
		}

		if (this.authentication.mode === 'handshake') {
			await this.handleHandshakeUpgrade(context);
			return;
		}

		this.server.handleUpgrade(request, socket, head, async (ws) => {
			this.catchInvalidMessages(ws);

			const state = {
				accountability: createDefaultAccountability(accountabilityOverrides),
				expires_at: null,
			} as AuthenticationState;

			this.server.emit('connection', ws, state);
		});
	}

	protected async handleTokenUpgrade(
		{ request, socket, head, accountabilityOverrides }: UpgradeContext,
		token: string | null,
	) {
		let accountability: Accountability | null = null;
		let expires_at: number | null = null;

		if (token) {
			try {
				const state = await authenticateConnection({ access_token: token }, accountabilityOverrides);
				accountability = state.accountability;
				expires_at = state.expires_at;
			} catch {
				accountability = null;
				expires_at = null;
			}
		}

		if (!token || !accountability || !accountability.user) {
			logger.debug('WebSocket upgrade denied - ' + JSON.stringify(accountability || 'invalid'));
			socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
			socket.destroy();
			return;
		}

		try {
			this.checkUserRequirements(accountability);
		} catch {
			logger.debug('WebSocket upgrade denied - ' + JSON.stringify(accountability || 'invalid'));
			socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
			socket.destroy();
			return;
		}

		this.server.handleUpgrade(request, socket, head, async (ws) => {
			this.catchInvalidMessages(ws);
			const state = { accountability, expires_at } as AuthenticationState;
			this.server.emit('connection', ws, state);
		});
	}

	protected async handleHandshakeUpgrade({ request, socket, head, accountabilityOverrides }: UpgradeContext) {
		this.server.handleUpgrade(request, socket, head, async (ws) => {
			this.catchInvalidMessages(ws);

			try {
				const payload = await waitForAnyMessage(ws, this.authentication.timeout);
				if (getMessageType(payload) !== 'auth') throw new Error();

				const state = await authenticateConnection(WebSocketAuthMessage.parse(payload), accountabilityOverrides);

				this.checkUserRequirements(state.accountability);

				ws.send(authenticationSuccess(payload['uid'], state.refresh_token));

				this.server.emit('connection', ws, state);
			} catch {
				logger.debug('WebSocket authentication handshake failed');
				const error = new WebSocketError('auth', 'AUTH_FAILED', 'Authentication handshake failed.');
				handleWebSocketError(ws, error, 'auth');
				ws.close();
			}
		});
	}

	createClient(ws: WebSocket, { accountability, expires_at }: AuthenticationState) {
		const client = ws as WebSocketClient;
		client.accountability = accountability;
		client.expires_at = expires_at;
		client.uid = randomUUID();
		client.auth_timer = null;

		ws.on('message', async (data: WebSocket.RawData) => {
			if (this.rateLimiter !== null) {
				try {
					await this.rateLimiter.consume(client.uid);
				} catch (limit) {
					const timeout = (limit as any)?.msBeforeNext ?? this.rateLimiter.msDuration;

					const error = new WebSocketError(
						'server',
						'REQUESTS_EXCEEDED',
						`Too many messages, retry after ${timeout}ms.`,
					);

					handleWebSocketError(client, error, 'server');
					logger.debug(`WebSocket#${client.uid} is rate limited`);
					return;
				}
			}

			let message: WebSocketMessage;

			try {
				message = this.parseMessage(data.toString());
			} catch (err: any) {
				handleWebSocketError(client, err, 'server');
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
		} catch {
			throw new WebSocketError('server', 'INVALID_PAYLOAD', 'Unable to parse the incoming message.');
		}

		return message;
	}

	protected async handleAuthRequest(client: WebSocketClient, message: WebSocketAuthMessage) {
		try {
			let accountabilityOverrides = {};

			/**
			 * Re-use the existing ip, userAgent and origin accountability properties.
			 * They are only sent in the original connection request
			 */
			if (client.accountability) {
				accountabilityOverrides = {
					ip: client.accountability.ip,
					userAgent: client.accountability.userAgent,
					origin: client.accountability.origin,
				};
			}

			const { accountability, expires_at, refresh_token } = await authenticateConnection(
				message,
				accountabilityOverrides,
			);

			this.checkUserRequirements(accountability);

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
				error instanceof WebSocketError
					? error
					: new WebSocketError('auth', 'AUTH_FAILED', 'Authentication failed.', message.uid);

			handleWebSocketError(client, _error, 'auth');

			if (this.authentication.mode !== 'public') {
				client.close();
			}
		}
	}

	protected checkUserRequirements(_accountability: Accountability | null) {
		// there are no requirements in the abstract class
		return;
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
			handleWebSocketError(client, new TokenExpiredError(), 'auth');

			waitForMessageType(client, 'auth', this.authentication.timeout).catch((msg: WebSocketMessage) => {
				const error = new WebSocketError('auth', 'AUTH_TIMEOUT', 'Authentication timed out.', msg?.uid);
				handleWebSocketError(client, error, 'auth');

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

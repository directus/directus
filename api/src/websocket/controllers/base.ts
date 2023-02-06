import type { Accountability } from '@directus/shared/types';
import type { IncomingMessage, Server as httpServer } from 'http';
import type { ParsedUrlQuery } from 'querystring';
import WebSocket, { WebSocketServer } from 'ws';
import type internal from 'stream';
import { parse } from 'url';
import logger from '../../logger';
import { getAccountabilityForToken } from '../../utils/get-accountability-for-token';
import { getExpiresAtForToken } from '../utils/get-expires-at-for-token';
import { authenticateConnection, authenticationSuccess } from '../authenticate';
import type { AuthenticationState, AuthMessage, UpgradeContext, WebSocketClient, WebSocketMessage } from '../types';
import { waitForAnyMessage, waitForMessageType } from '../utils/wait-for-message';
import { TokenExpiredException } from '../../exceptions';
import { handleWebsocketException, WebSocketException } from '../exceptions';
import emitter from '../../emitter';
import { createRateLimiter } from '../../rate-limiter';
import type { RateLimiterAbstract } from 'rate-limiter-flexible';
import { v4 as uuid } from 'uuid';
import { trimUpper } from '../utils/message';

export default abstract class SocketController {
	name: string;
	server: WebSocket.Server;
	clients: Set<WebSocketClient>;
	authentication: {
		mode: 'public' | 'handshake' | 'strict';
		timeout: number;
		verbose: boolean;
	};
	endpoint: string;
	private authTimer: NodeJS.Timer | null;
	private rateLimiter: RateLimiterAbstract;

	constructor(
		httpServer: httpServer,
		name: string,
		endpoint: string,
		authentication: {
			mode: 'public' | 'handshake' | 'strict';
			verbose: boolean;
			timeout: number;
		}
	) {
		this.server = new WebSocketServer({ noServer: true });
		this.clients = new Set();
		this.authTimer = null;
		this.name = name;
		this.endpoint = endpoint;
		this.authentication = authentication;
		this.rateLimiter = createRateLimiter({
			keyPrefix: 'websocket',
		});
		httpServer.on('upgrade', this.handleUpgrade.bind(this));
	}
	protected async handleUpgrade(request: IncomingMessage, socket: internal.Duplex, head: Buffer) {
		const { pathname, query } = parse(request.url!, true);
		if (pathname !== this.endpoint) return;
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
			logger.warn('Websocket upgrade denied - ' + JSON.stringify(accountability || 'invalid'));
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
				const payload: WebSocketMessage = await waitForAnyMessage(ws, this.authentication.timeout);
				if (payload.type !== 'AUTH') throw new Error();

				const state = await authenticateConnection(payload as AuthMessage);
				ws.send(authenticationSuccess(payload['uid']));
				this.server.emit('connection', ws, state);
			} catch {
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
			this.log(`${client.accountability?.user || 'public user'} message`);
			try {
				await this.rateLimiter.consume(client.uid);
			} catch (limit) {
				const timeout = (limit as any)?.msBeforeNext ?? this.rateLimiter.msDuration;
				const error = new WebSocketException(
					'server',
					'REQUESTS_EXCEEDED',
					`Rate limit reached! Try again in ${timeout}ms`
				);
				handleWebsocketException(client, error);
				this.log(`${client.accountability?.user || 'public user'} rate limited`);
				return;
			}
			let message: WebSocketMessage;
			try {
				message = this.parseMessage(data.toString());
			} catch (err: any) {
				handleWebsocketException(client, err);
				return;
			}
			this.log(JSON.stringify(message));
			if (trimUpper(message.type) === 'AUTH') {
				await this.handleAuthRequest(client, message as AuthMessage);
				return;
			}
			ws.emit('parsed-message', message);
		});
		ws.on('error', () => {
			this.log(`${client.accountability?.user || 'public user'} error`);
			if (this.authTimer) clearTimeout(this.authTimer);
			this.clients.delete(client);
		});
		ws.on('close', () => {
			this.log(`${client.accountability?.user || 'public user'} closed`);
			if (this.authTimer) clearTimeout(this.authTimer);
			this.clients.delete(client);
		});
		this.log(`${client.accountability?.user || 'public user'} connected`);
		this.setTokenExpireTimer(client);
		this.clients.add(client);
		return client;
	}
	protected parseMessage(data: string) {
		let message: WebSocketMessage;
		try {
			message = JSON.parse(data);
		} catch (err: any) {
			throw new WebSocketException('server', 'INVALID_PAYLOAD', 'Unable to parse the incoming message!');
		}
		return message;
	}
	protected async handleAuthRequest(client: WebSocketClient, message: AuthMessage) {
		try {
			const { accountability, expiresAt } = await authenticateConnection(message);
			client.accountability = accountability;
			client.expiresAt = expiresAt;
			this.setTokenExpireTimer(client);
			emitter.emitAction('websocket.auth.success', { client });
			if (this.authentication.verbose) {
				client.send(authenticationSuccess(message.uid));
			}
			this.log(`${client.accountability?.user || 'public user'} authenticated`);
			return;
		} catch (error) {
			this.log(`${client.accountability?.user || 'public user'} failed authentication`);
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
		if (this.authTimer) clearTimeout(this.authTimer);
		if (!client.expiresAt) return;
		const expiresIn = client.expiresAt * 1000 - Date.now();
		this.authTimer = setTimeout(() => {
			client.accountability = null;
			client.expiresAt = null;
			handleWebsocketException(client, new TokenExpiredException(), 'auth');
			waitForMessageType(client, 'AUTH', this.authentication.timeout).catch((msg: WebSocketMessage) => {
				const error = new WebSocketException('auth', 'AUTH_TIMEOUT', 'Authentication timed out.', msg?.uid);
				handleWebsocketException(client, error);
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
	log(message: string) {
		logger.debug(`[${this.name}] ${message}`);
	}
}

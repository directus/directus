import type { DirectusClient } from '../types/client.js';
import type {
	SubscribeOptions,
	SubscriptionEvents,
	SubscriptionOutput,
	WebSocketClient,
	WebSocketConfig,
	WebSocketEventHandler,
	WebSocketEvents,
} from './types.js';
import { messageCallback } from './utils/message-callback.js';
import { generateUid } from './utils/generate-uid.js';
import { pong } from './commands/pong.js';
import { auth } from './commands/auth.js';
import type { AuthenticationClient } from '../auth/types.js';
import { sleep } from './index.js';
import type { WebSocketInterface } from '../index.js';

type AuthWSClient<Schema extends object> = WebSocketClient<Schema> & AuthenticationClient<Schema>;

const defaultRealTimeConfig: WebSocketConfig = {
	authMode: 'handshake',
	heartbeat: true,
	reconnect: {
		delay: 1000, // 1 second
		retries: 10,
	},
};

const WebSocketState = {
	OPEN: 1,
	CLOSED: 3,
} as const;

/**
 * Creates a client to communicate with a Directus REST WebSocket.
 *
 * @param config The optional configuration.
 *
 * @returns A Directus realtime client.
 */
export function realtime(config: WebSocketConfig = {}) {
	return <Schema extends object>(client: DirectusClient<Schema>) => {
		config = { ...defaultRealTimeConfig, ...config };
		let socket: WebSocketInterface | null = null;
		let uid = generateUid();
		let reconnectAttempts = 0;
		let reconnecting = false;

		const hasAuth = (client: AuthWSClient<Schema>) => 'getToken' in client;

		const withStrictAuth = async (url: URL, currentClient: AuthWSClient<Schema>) => {
			if (config.authMode === 'strict' && hasAuth(currentClient)) {
				const token = await currentClient.getToken();
				if (token) url.searchParams.set('access_token', token);
			}

			return url;
		};

		const getSocketUrl = async (currentClient: AuthWSClient<Schema>) => {
			if ('url' in config) return await withStrictAuth(new client.globals.URL(config.url), currentClient);

			// if the main URL is a websocket URL use it directly!
			if (['ws:', 'wss:'].includes(client.url.protocol)) {
				return await withStrictAuth(client.url, currentClient);
			}

			// try filling in the defaults based on the main URL
			const newUrl = new client.globals.URL(client.url.toString());
			newUrl.protocol = client.url.protocol === 'https:' ? 'wss:' : 'ws:';
			newUrl.pathname = '/websocket';

			return await withStrictAuth(newUrl, currentClient);
		};

		const resetConnection = () => {
			socket = null;
			uid = generateUid();
		};

		function reconnect(this: WebSocketClient<Schema>) {
			// try to reconnect
			if (config.reconnect && !reconnecting && reconnectAttempts < config.reconnect.retries) {
				reconnecting = true;

				setTimeout(() => {
					reconnectAttempts += 1;

					this.connect()
						.then(() => {
							reconnectAttempts = 0;
							reconnecting = false;
						})
						.catch(() => {
							/* failed to connect */
						});
				}, Math.max(1, config.reconnect.delay));
			} else {
				reconnecting = false;
			}
		}

		const eventHandlers: Record<WebSocketEvents, Set<WebSocketEventHandler>> = {
			open: new Set<WebSocketEventHandler>([]),
			error: new Set<WebSocketEventHandler>([]),
			close: new Set<WebSocketEventHandler>([]),
			message: new Set<WebSocketEventHandler>([]),
		};

		const handleMessages = async (ws: WebSocketInterface, currentClient: AuthWSClient<Schema>) => {
			while (ws.readyState !== WebSocketState.CLOSED) {
				const message = await messageCallback(ws).catch(() => {
					/* ignore invalid messages */
				});

				if (!message) continue;

				if ('type' in message) {
					if (
						message['type'] === 'auth' &&
						'status' in message &&
						message['status'] === 'error' &&
						'error' in message
					) {
						if (message['error'] === 'TOKEN_EXPIRED' && hasAuth(currentClient)) {
							const access_token = await currentClient.getToken();

							if (access_token) {
								ws.send(auth({ access_token }));
								continue;
							}
						}

						if (message['error'] === 'AUTH_TIMEOUT') {
							ws.close();
							continue;
						}
					}

					if (config.heartbeat && message['type'] === 'ping') {
						ws.send(pong());
						continue;
					}
				}

				eventHandlers['message'].forEach((handler) => handler.call(ws, message));
			}
		};

		return {
			async connect() {
				// we need to use THIS here instead of client to access overridden functions
				const self = this as AuthWSClient<Schema>;
				const url = await getSocketUrl(self);

				return new Promise<void>((resolve, reject) => {
					let resolved = false;
					const ws = new client.globals.WebSocket(url);

					ws.addEventListener('open', async (evt: Event) => {
						if (config.authMode === 'handshake' && hasAuth(self)) {
							const access_token = await self.getToken();

							if (access_token) ws.send(auth({ access_token }));
						}

						resolved = true;
						eventHandlers['open'].forEach((handler) => handler.call(ws, evt));

						handleMessages(ws, self);
						resolve();
					});

					ws.addEventListener('error', (evt: Event) => {
						eventHandlers['error'].forEach((handler) => handler.call(ws, evt));
						ws.close();
						if (!resolved) reject(evt);
					});

					ws.addEventListener('close', (evt: CloseEvent) => {
						eventHandlers['close'].forEach((handler) => handler.call(ws, evt));
						resetConnection();
						reconnect.call(this);
						if (!resolved) reject(evt);
					});

					socket = ws;
				});
			},
			disconnect() {
				if (socket && socket?.readyState === WebSocketState.OPEN) {
					socket.close();
				}

				socket = null;
			},
			onWebSocket(event: WebSocketEvents, callback: (this: WebSocketInterface, ev: Event | CloseEvent | any) => any) {
				if (event === 'message') {
					// add some message parsing
					const updatedCallback = function (this: WebSocketInterface, event: MessageEvent<any>) {
						if (typeof event.data !== 'string') return callback.call(this, event);

						try {
							return callback.call(this, JSON.parse(event.data));
						} catch {
							return callback.call(this, event);
						}
					};

					eventHandlers[event].add(updatedCallback);
					return () => eventHandlers[event].delete(updatedCallback);
				}

				eventHandlers[event].add(callback);
				return () => eventHandlers[event].delete(callback);
			},
			sendMessage(message: string | Record<string, any>) {
				if (!socket || socket?.readyState !== WebSocketState.OPEN) {
					// TODO use directus error
					throw new Error('websocket connection not OPEN');
				}

				if (typeof message === 'string') {
					socket.send(message);
					return;
				}

				if ('uid' in message === false) {
					message['uid'] = uid.next().value;
				}

				socket?.send(JSON.stringify(message));
			},
			async subscribe<Collection extends keyof Schema, const Options extends SubscribeOptions<Schema, Collection>>(
				collection: Collection,
				options = {} as Options
			) {
				if (!socket || socket.readyState !== WebSocketState.OPEN) await this.connect();
				if ('uid' in options === false) options.uid = uid.next().value;

				let subscribed = true;
				const ws = socket!;
				const send = (obj: Record<string, any>) => ws.send(JSON.stringify(obj));

				send({ ...options, collection, type: 'subscribe' });

				async function* subscriptionGenerator(): AsyncGenerator<
					SubscriptionOutput<Schema, Collection, Options['query'], SubscriptionEvents>,
					void,
					unknown
				> {
					while (subscribed && ws && ws.readyState === WebSocketState.OPEN) {
						const message = await messageCallback(ws).catch(() => {
							/* let the loop continue */
						});

						if (!message) continue;

						if (
							'type' in message &&
							'status' in message &&
							message['type'] === 'subscribe' &&
							message['status'] === 'error'
						) {
							throw message;
						}

						if (
							'type' in message &&
							'uid' in message &&
							message['type'] === 'subscription' &&
							message['uid'] === options.uid
						) {
							yield message as SubscriptionOutput<Schema, Collection, Options['query'], SubscriptionEvents>;
						}
					}

					if (config.reconnect && reconnecting) {
						while (reconnecting) await sleep(10);

						if (socket && socket.readyState === WebSocketState.OPEN) {
							// re-subscribe on the new connection
							socket.send(JSON.stringify({ ...options, collection, type: 'subscribe' }));

							yield* subscriptionGenerator();
						}
					}
				}

				return {
					subscription: subscriptionGenerator(),
					unsubscribe() {
						send({ uid: options.uid, type: 'unsubscribe' });
						subscribed = false;
					},
				};
			},
		} as WebSocketClient<Schema>;
	};
}

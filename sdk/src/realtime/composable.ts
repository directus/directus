import type { AuthenticationClient } from '../auth/types.js';
import type { ConsoleInterface, ExtendedQuery, WebSocketInterface } from '../index.js';
import type { DirectusClient } from '../types/client.js';
import { queryToParams } from '../utils/query-to-params.js';
import { auth } from './commands/auth.js';
import { pong } from './commands/pong.js';
import type {
	ConnectionState,
	ReconnectState,
	SubscribeOptions,
	SubscriptionEvents,
	SubscriptionOutput,
	WebSocketAuthError,
	WebSocketClient,
	WebSocketConfig,
	WebSocketEventHandler,
	WebSocketEvents,
} from './types.js';
import { generateUid } from './utils/generate-uid.js';
import { messageCallback } from './utils/message-callback.js';

type AuthWSClient<Schema> = WebSocketClient<Schema> & AuthenticationClient<Schema>;

const defaultRealTimeConfig: WebSocketConfig = {
	authMode: 'handshake',
	heartbeat: true,
	debug: false,
	connect: {
		timeout: 10000, // 10 seconds
	},
	reconnect: {
		delay: 1000, // 1 second
		retries: 10,
	},
};

/**
 * Creates a client to communicate with a Directus REST WebSocket.
 *
 * @param config The optional configuration.
 *
 * @returns A Directus realtime client.
 */
export function realtime(config: WebSocketConfig = {}) {
	return <Schema>(client: DirectusClient<Schema>) => {
		config = { ...defaultRealTimeConfig, ...config };
		let uid = generateUid();

		let state: ConnectionState = {
			code: 'closed',
		};

		const reconnectState: ReconnectState = {
			attempts: 0,
			active: false,
		};

		// Disable reconnection after manual disconnection
		let wasManuallyDisconnected = false;

		const subscriptions = new Set<Record<string, any>>();

		const hasAuth = (client: AuthWSClient<Schema>) => 'getToken' in client;

		const debug = (level: keyof ConsoleInterface, ...data: any[]) =>
			config.debug && client.globals.logger[level]('[Directus SDK]', ...data);

		const withStrictAuth = async (url: URL | string, currentClient: AuthWSClient<Schema>) => {
			const newUrl = new client.globals.URL(url);

			if (config.authMode === 'strict' && hasAuth(currentClient)) {
				const token = await currentClient.getToken();
				if (token) newUrl.searchParams.set('access_token', token);
			}

			return newUrl.toString();
		};

		const getSocketUrl = async (currentClient: AuthWSClient<Schema>) => {
			if ('url' in config) return await withStrictAuth(config.url, currentClient);

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

		const reconnect = (self: WebSocketClient<Schema>) => {
			const reconnectPromise = new Promise<WebSocketInterface>((resolve, reject) => {
				if (!config.reconnect || wasManuallyDisconnected) return reject();

				debug(
					'info',
					`reconnect #${reconnectState.attempts} ` +
						(reconnectState.attempts >= config.reconnect.retries
							? 'maximum retries reached'
							: `trying again in ${Math.max(100, config.reconnect.delay)}ms`),
				);

				if (reconnectState.active) return reconnectState.active;

				if (reconnectState.attempts >= config.reconnect.retries) {
					reconnectState.attempts = -1;
					return reject();
				}

				setTimeout(
					() =>
						self
							.connect()
							.then((ws) => {
								// reconnect to existing subscriptions
								subscriptions.forEach((sub) => {
									self.sendMessage(sub);
								});

								return ws;
							})
							.then(resolve)
							.catch(reject),
					Math.max(100, config.reconnect.delay),
				);
			});

			reconnectState.attempts += 1;

			reconnectState.active = reconnectPromise
				.catch(() => {})
				.finally(() => {
					reconnectState.active = false;
				});
		};

		const eventHandlers: Record<WebSocketEvents, Set<WebSocketEventHandler>> = {
			open: new Set<WebSocketEventHandler>([]),
			error: new Set<WebSocketEventHandler>([]),
			close: new Set<WebSocketEventHandler>([]),
			message: new Set<WebSocketEventHandler>([]),
		};

		function isAuthError(message: Record<string, any> | MessageEvent<string>): message is WebSocketAuthError {
			return (
				'type' in message &&
				'status' in message &&
				'error' in message &&
				'code' in message['error'] &&
				'message' in message['error'] &&
				message['type'] === 'auth' &&
				message['status'] === 'error'
			);
		}

		async function handleAuthError(message: WebSocketAuthError, currentClient: AuthWSClient<Schema>) {
			if (state.code !== 'open') return;

			if (message.error.code === 'TOKEN_EXPIRED') {
				debug('warn', 'Authentication token expired!');

				if (hasAuth(currentClient)) {
					const access_token = await currentClient.getToken();

					if (!access_token) {
						throw Error('No token for re-authenticating the websocket');
					}

					state.connection.send(auth({ access_token }));
				}
			}

			if (message.error.code === 'AUTH_TIMEOUT') {
				if (state.firstMessage && config.authMode === 'public') {
					// detected likely misconfigured authMode
					debug('warn', 'Authentication failed! Currently the "authMode" is "public" try using "handshake" instead');
					config.reconnect = false;
				} else {
					debug('warn', 'Authentication timed out!');
				}

				return state.connection.close();
			}

			if (message.error.code === 'AUTH_FAILED') {
				if (state.firstMessage && config.authMode === 'public') {
					// detected likely misconfigured authMode
					debug('warn', 'Authentication failed! Currently the "authMode" is "public" try using "handshake" instead');
					config.reconnect = false;
					return state.connection.close();
				}

				debug('warn', 'Authentication failed!');
			}
		}

		const handleMessages = async (currentClient: AuthWSClient<Schema>) => {
			while (state.code === 'open') {
				const message = await messageCallback(state.connection).catch(() => {
					/* ignore invalid messages */
				});

				if (!message) continue;

				if (isAuthError(message)) {
					await handleAuthError(message, currentClient);
					state.firstMessage = false;
					continue;
				}

				if (config.heartbeat && message['type'] === 'ping') {
					state.connection.send(pong());
					state.firstMessage = false;
					continue;
				}

				eventHandlers['message'].forEach((handler) => {
					if (state.code === 'open') handler.call(state.connection, message);
				});

				state.firstMessage = false;
			}
		};

		return {
			async isConnected() {
				if (state.code === 'connecting') {
					try {
						await state.connection;
					} catch {
						return false;
					}
				}

				return state.code === 'open';
			},
			async connect() {
				wasManuallyDisconnected = false;

				if (state.code === 'connecting') {
					// wait for the current connection to open
					return await state.connection;
				} else if (state.code !== 'closed') {
					// error state
					throw new Error(`Cannot connect when state is "${state.code}"`);
				}

				const { promise: connectPromise, resolve, reject } = Promise.withResolvers<WebSocketInterface>();

				state = {
					code: 'connecting',
					connection: connectPromise,
				};

				// we need to use THIS here instead of client to access overridden functions
				const self = this as AuthWSClient<Schema>;
				const url = await getSocketUrl(self);
				debug('info', `Connecting to ${url}...`);

				let resolved = false;
				const ws = new client.globals.WebSocket(url);

				let connectTimeout: ReturnType<typeof setTimeout> | undefined;

				if (config.connect) {
					connectTimeout = setTimeout(() => {
						reject('Connection attempt timed out.');
					}, config.connect.timeout ?? 10000);
				}

				ws.addEventListener('open', async (evt: Event) => {
					debug('info', `Connection open.`);

					state = { code: 'open', connection: ws, firstMessage: true };
					reconnectState.attempts = 0;
					reconnectState.active = false;
					clearTimeout(connectTimeout);
					handleMessages(self);

					if (config.authMode === 'handshake' && hasAuth(self)) {
						const access_token = await self.getToken();

						if (!access_token) {
							return reject(
								'No token for authenticating the websocket. Make sure to provide one or call the login() function beforehand.',
							);
						}

						ws.send(auth({ access_token }));
						const confirm = await messageCallback(ws);

						if (
							!(
								confirm &&
								'type' in confirm &&
								'status' in confirm &&
								confirm['type'] === 'auth' &&
								confirm['status'] === 'ok'
							)
						) {
							return reject('Authentication failed while opening websocket connection');
						} else {
							debug('info', 'Authentication successful!');
						}
					}

					eventHandlers['open'].forEach((handler) => handler.call(ws, evt));

					resolved = true;
					resolve(ws);
				});

				ws.addEventListener('error', (evt: Event) => {
					debug('warn', `Connection errored.`);
					eventHandlers['error'].forEach((handler) => handler.call(ws, evt));
					ws.close();
					state = { code: 'error' };
					if (!resolved) reject(evt);
				});

				ws.addEventListener('close', (evt: CloseEvent) => {
					debug('info', `Connection closed.`);
					eventHandlers['close'].forEach((handler) => handler.call(ws, evt));
					uid = generateUid();
					state = { code: 'closed' };
					reconnect(this);
					if (!resolved) reject(evt);
				});

				return connectPromise;
			},
			disconnect() {
				wasManuallyDisconnected = true;

				if (state.code === 'open') {
					state.connection.close();
				}
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
				if (state.code !== 'open') {
					// TODO use directus error
					throw new Error(
						'Cannot send messages without an open connection. Make sure you are calling "await client.connect()".',
					);
				}

				if (typeof message === 'string') {
					return state.connection.send(message);
				}

				if ('uid' in message === false) {
					message['uid'] = uid.next().value;
				}

				state.connection.send(JSON.stringify(message));
			},
			async subscribe<Collection extends keyof Schema, const Options extends SubscribeOptions<Schema, Collection>>(
				collection: Collection,
				options = {} as Options,
			) {
				if ('uid' in options === false) options.uid = uid.next().value;

				if (options.query) {
					options.query = queryToParams(options.query as ExtendedQuery<Schema, Schema[Collection]>);
				}

				subscriptions.add({ ...options, collection, type: 'subscribe' });

				if (state.code !== 'open') {
					debug('info', 'No connection available for subscribing!');
					await this.connect();
				}

				this.sendMessage({ ...options, collection, type: 'subscribe' });
				let subscribed = true;

				async function* subscriptionGenerator(): AsyncGenerator<
					SubscriptionOutput<Schema, Collection, Options['query'], SubscriptionEvents>,
					void,
					unknown
				> {
					while (subscribed && state.code === 'open') {
						const message = await messageCallback(state.connection).catch(() => {
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

					if (config.reconnect && reconnectState.active) {
						await reconnectState.active;

						if (state.code === 'open') {
							// re-subscribe on the new connection
							state.connection.send(JSON.stringify({ ...options, collection, type: 'subscribe' }));

							yield* subscriptionGenerator();
						}
					}
				}

				const unsubscribe = () => {
					subscriptions.delete({ ...options, collection, type: 'subscribe' });
					this.sendMessage({ uid: options.uid, type: 'unsubscribe' });
					subscribed = false;
				};

				return {
					subscription: subscriptionGenerator(),
					unsubscribe,
				};
			},
		} as WebSocketClient<Schema>;
	};
}

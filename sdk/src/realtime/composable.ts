import type { AuthenticationClient } from '../auth/types.js';
import type { ConsoleInterface, ExtendedQuery, WebSocketInterface } from '../index.js';
import type { DirectusClient } from '../types/client.js';
import { queryToParams } from '../utils/query-to-params.js';
import { auth } from './commands/auth.js';
import { pong } from './commands/pong.js';
import type {
	ConnectionState,
	ReconnectState,
	RemoveEventHandler,
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
import { createMessageQueue, MAX_QUEUED_MESSAGES } from './utils/message-queue.js';

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

		/**
		 * Schedules a reconnection attempt. Called for every closed connection, including the ones a
		 * previous attempt opened, which is what makes the retries a chain.
		 *
		 * @returns Whether an attempt was scheduled. When this is false the connection is not coming
		 * back on its own, and `reconnectState.active` settles to false once the last attempt is done.
		 */
		const reconnect = (self: WebSocketClient<Schema>): boolean => {
			if (!config.reconnect || wasManuallyDisconnected) return false;

			if (reconnectState.attempts >= config.reconnect.retries) {
				debug('info', `reconnect #${reconnectState.attempts} maximum retries reached`);

				// reset so a later disconnect gets a fresh set of attempts
				reconnectState.attempts = 0;
				return false;
			}

			const delay = Math.max(100, config.reconnect.delay);
			debug('info', `reconnect #${reconnectState.attempts} trying again in ${delay}ms`);

			const reconnectPromise = new Promise<WebSocketInterface>((resolve, reject) => {
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
					delay,
				);
			});

			reconnectState.attempts += 1;

			// A failed attempt closes its own connection, which schedules the next one before this
			// promise settles, so only clear the state if this is still the pending attempt.
			const attempt: Promise<WebSocketInterface | void> = reconnectPromise
				.catch(() => {})
				.finally(() => {
					if (reconnectState.active === attempt) reconnectState.active = false;
				});

			reconnectState.active = attempt;

			return true;
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

		const handleMessages = async (currentClient: AuthWSClient<Schema>, connection: WebSocketInterface) => {
			// A single listener for the lifetime of the connection: a socket can drain several frames
			// from one read, and re-registering per message would drop everything but the first.
			const queue = createMessageQueue<Record<string, any> | MessageEvent<string>>({
				onDrop: (dropped) => {
					debug('warn', `Incoming messages are not being handled fast enough, dropped ${dropped} message(s).`);
				},
			});

			const receive = (event: MessageEvent<string>) => {
				try {
					const message = JSON.parse(event.data);

					/* ignore invalid messages */
					if (typeof message !== 'object' || message === null || Array.isArray(message)) return;

					queue.push(message);
				} catch {
					// pass the original event on to allow customization
					queue.push(event);
				}
			};

			const stop = () => queue.end();

			connection.addEventListener('message', receive);
			connection.addEventListener('close', stop);
			connection.addEventListener('error', stop);

			try {
				for await (const message of queue.stream()) {
					try {
						if (isAuthError(message)) {
							await handleAuthError(message, currentClient);
							continue;
						}

						if (config.heartbeat && message['type'] === 'ping') {
							if (state.code === 'open') state.connection.send(pong());
							continue;
						}

						eventHandlers['message'].forEach((handler) => handler.call(connection, message));
					} finally {
						if (state.code === 'open') state.firstMessage = false;
					}
				}
			} finally {
				connection.removeEventListener('message', receive);
				connection.removeEventListener('close', stop);
				connection.removeEventListener('error', stop);
			}
		};

		return {
			/**
			 * Checks if a websocket connection has been established.
			 * Does not check authentication status.
			 */
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

				// Eventually update to Promise.withResolvers()
				let resolve!: (value: WebSocketInterface | PromiseLike<WebSocketInterface>) => void;
				let reject!: (reason?: any) => void;

				const connectPromise = new Promise<WebSocketInterface>((res, rej) => {
					resolve = res;
					reject = rej;
				});

				state = {
					code: 'connecting',
					connection: connectPromise,
				};

				// we need to use THIS here instead of client to access overridden functions
				const self = this as AuthWSClient<Schema>;
				let ws: WebSocketInterface;

				try {
					const url = await getSocketUrl(self);
					debug('info', `Connecting to ${url}...`);

					ws = new client.globals.WebSocket(url);
				} catch (e) {
					state = { code: 'closed' };
					reject(e);
					throw e;
				}

				let resolved = false;
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
					handleMessages(self, ws);

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
					uid = generateUid();
					state = { code: 'closed' };
					// decide before notifying the handlers, so they can tell whether the connection is coming
					// back by looking at reconnectState.active instead of working it out for themselves
					reconnect(this);
					eventHandlers['close'].forEach((handler) => handler.call(ws, evt));
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

				const subscriptionMessage = { ...options, collection, type: 'subscribe' };
				subscriptions.add(subscriptionMessage);

				if (state.code !== 'open') {
					debug('info', 'No connection available for subscribing!');
					await this.connect();
				}

				type Message = SubscriptionOutput<Schema, Collection, Options['query'], SubscriptionEvents>;

				// Listening starts before the subscription is sent, so no message can slip through
				// before (or between) pulls on the stream.
				const removeListeners: RemoveEventHandler[] = [];

				const messages = createMessageQueue<Message>({
					onEnd: () => {
						removeListeners.forEach((remove) => remove());
					},
					onDrop: (dropped) => {
						debug(
							'warn',
							`Subscription "${options.uid}" is not being consumed fast enough, ` +
								`dropped ${dropped} message(s) to stay within ${MAX_QUEUED_MESSAGES}.`,
						);
					},
				});

				removeListeners.push(
					this.onWebSocket('message', (message: Record<string, any>) => {
						if (typeof message !== 'object' || message === null || Array.isArray(message)) return;

						if (message['type'] === 'subscription' && message['uid'] === options.uid) {
							messages.push(message as Message);
							return;
						}

						// Subscribe errors carry the uid of the message that caused them, but an older API or an
						// error the server cannot attribute arrives without one, and then there is no way to
						// tell whose it is, so every open subscription has to fail.
						if (
							message['type'] === 'subscribe' &&
							message['status'] === 'error' &&
							(message['uid'] === undefined || message['uid'] === options.uid)
						) {
							messages.dispose(message);
						}
					}),
				);

				removeListeners.push(
					this.onWebSocket('close', async () => {
						// reconnect() has already decided by the time this runs. While an attempt is pending the
						// subscription is re-sent on the new connection and the listener above keeps filling this
						// queue, so wait the attempts out and only end once nothing is coming back.
						while (reconnectState.active) await reconnectState.active;

						if (state.code !== 'open') messages.end();
					}),
				);

				try {
					this.sendMessage(subscriptionMessage);
				} catch (error) {
					// nothing is subscribed, so drop the registration and the listeners with it
					subscriptions.delete(subscriptionMessage);
					messages.dispose();
					throw error;
				}

				const unsubscribe = () => {
					subscriptions.delete(subscriptionMessage);
					messages.dispose();
					this.sendMessage({ uid: options.uid, type: 'unsubscribe' });
				};

				return {
					subscription: messages.stream(),
					unsubscribe,
				};
			},
		} as WebSocketClient<Schema>;
	};
}

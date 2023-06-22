import type { DirectusClient } from '../client.js';
import type { SubscribeOptions, WebSocketClient, WebSocketConfig } from './types.js';
import { messageCallback } from './utils/message-callback.js';
import { generateUid } from './utils/generate-uid.js';

/**
 * Creates a client to communicate with a Directus REST WebSocket.
 *
 * @param config The optional configuration.
 *
 * @returns A Directus realtime client.
 */
export function realtime(config: WebSocketConfig = { authMode: 'handshake' }) {
	return <Schema extends object>(client: DirectusClient<Schema>) => {
		let socket: globalThis.WebSocket | null = null;
		let uid = generateUid();

		const withStrictAuth = (url: URL) => {
			if (config.authMode === 'strict') {
				// const token = await client.getToken();
				// if (token) url.searchParams.set('access_token', token);
			}

			return url;
		};

		const getSocketUrl = () => {
			if ('url' in config) return withStrictAuth(new URL(config.url));

			// if the main URL is a websocket URL use it directly!
			if (['ws:', 'wss:'].includes(client.url.protocol)) {
				return withStrictAuth(client.url);
			}

			// try filling in the defaults based on the main URL
			const newUrl = new URL(client.url.toString());
			newUrl.protocol = client.url.protocol === 'https:' ? 'wss:' : 'ws:';
			newUrl.pathname = '/websocket';

			return withStrictAuth(newUrl);
		};

		const resetConnection = () => {
			socket = null;
			uid = generateUid();
			// TODO reconnecting strategy
		};

		const handleMessages = async (ws: globalThis.WebSocket) => {
			while (ws.readyState !== WebSocket.CLOSED) {
				const message = await messageCallback(ws);

				if ('type' in message && message['type'] === 'auth') {
					ws.send(JSON.stringify({ type: 'auth', access_token: await client.getToken() }));
				}

				if ('type' in message && message['type'] === 'ping') {
					ws.send('{ "type": "pong" }');
				}
			}
		};

		return {
			async connect() {
				return new Promise<void>((resolve, reject) => {
					let resolved = false;
					const ws = new globalThis.WebSocket(getSocketUrl());

					ws.addEventListener('open', async () => {
						if (config.authMode === 'handshake') {
							const token = await client.getToken();

							if (token) {
								ws.send(JSON.stringify({ type: 'auth', access_token: token }));
							}
						}

						resolved = true;
						handleMessages(ws);
						resolve();
					});

					ws.addEventListener('error', (evt) => {
						resetConnection();
						if (!resolved) reject(evt);
					});

					ws.addEventListener('close', (evt) => {
						resetConnection();
						if (!resolved) reject(evt);
					});

					socket = ws;
				});
			},
			disconnect() {
				if (socket && socket?.readyState === WebSocket.OPEN) {
					socket.close();
				}

				socket = null;
			},
			message(message: Record<string, any>) {
				if (!socket || socket?.readyState !== WebSocket.OPEN) {
					throw new Error('websocket connection not OPEN');
				}

				if ('uid' in message === false) {
					message['uid'] = uid.next().value;
				}

				socket?.send(JSON.stringify(message));
			},
			async subscribe<Collection extends keyof Schema, Options extends SubscribeOptions<Schema, Collection>>(
				collection: Collection,
				options: Options = {} as Options
			) {
				if (!socket || socket.readyState !== WebSocket.OPEN) await this.connect();
				if ('uid' in options === false) options.uid = uid.next().value;

				let subscribed = true;
				const ws = socket!;
				const send = (obj: Record<string, any>) => ws.send(JSON.stringify(obj));

				send({ ...options, collection, type: 'subscribe' });

				async function* subscriptionGenerator() {
					while (subscribed && socket && socket.readyState === WebSocket.OPEN) {
						const message = await messageCallback(socket);

						if ('type' in message && message['type'] === 'subscription' && message['uid'] === options.uid) {
							yield message;
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

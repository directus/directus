import type { DirectusClient } from '../client.js';
import NativeWS from 'ws';
import { withoutTrailingSlash } from '../utils.js';
import type { Query } from '@directus/types';

export interface WebSocketConfig {
	url: string;
}

export interface WebSocketClientConfig {
	socketURL: string;
}

export type WebSocketStatus = 'OPEN' | 'CLOSED';

export type HookEvents = 'create' | 'update' | 'delete';

export interface SubscribeOptions {
	event?: HookEvents;
	query?: Query;
	uid?: string;
}

export interface WebSocketClient<Schema extends object> {
	config: WebSocketClientConfig;
	ws: {
		status: WebSocketStatus;
		socket: NativeWS | null;
	};
	connect(): Promise<void>;
	message(message: string | Record<string, any>): void;
	subscribe<Collection extends keyof Schema>(
		collection: Collection,
		opts?: SubscribeOptions
	): {
		subscription: AsyncGenerator<Schema[Collection], void, unknown>;
		unsubscribe(): void;
	};
}

export function RealTime(cfg: WebSocketConfig) {
	return <Schema extends object, Features extends object>(client: DirectusClient<Schema, Features>) => {
		const messageHandlers: Record<string, Deferred<any>> = {};

		const wsClient: WebSocketClient<Schema> = {
			config: {
				socketURL: withoutTrailingSlash(cfg.url),
			},
			ws: {
				status: 'CLOSED',
				socket: null,
			},
			async connect() {
				if (this.ws.status === 'OPEN') return;
				const url = this.config.socketURL;
				const WS = client.config.ws ?? NativeWS;
				return new Promise((resolve) => {
					const ws = new WS(url);

					ws.onopen = () => {
						this.ws.status = 'OPEN';
						this.ws.socket = ws;

						resolve();
					};

					ws.onmessage = (event) => {
						const data = JSON.parse(event.data.toString());

						if ('uid' in data) {
							const uid = String(data.uid);

							if (uid in messageHandlers) {
								messageHandlers[uid]?.resolve(data);
							}
						}
					};

					ws.onclose = () => {
						this.ws.status = 'CLOSED';
						this.ws.socket = null;
					};

					ws.onerror = () => {
						this.ws.status = 'CLOSED';
						this.ws.socket = null;
					};
				});
			},
			message(message: string | Record<string, any>) {
				if (this.ws.status === 'CLOSED') {
					throw new Error('websocket connection not OPEN');
				}

				message = typeof message === 'string' ? message : JSON.stringify(message);
				this.ws.socket?.send(message);
			},
			subscribe<Collection extends keyof Schema>(collection: Collection, options: SubscribeOptions = {}) {
				if (this.ws.status === 'CLOSED') {
					throw new Error('websocket connection not OPEN');
				}

				const send = this.message.bind(this);

				const uid = options.uid ?? '123';

				send({
					...options,
					uid,
					collection,
					type: 'subscribe',
				});

				messageHandlers[uid] = new Deferred();

				let subscribed = true;

				const test = async function* () {
					while (subscribed) {
						const message = await (messageHandlers[uid]?.promise ?? Promise.resolve(''));

						messageHandlers[uid] = new Deferred();

						if (message) yield message;
					}
				} as () => AsyncGenerator<Schema[Collection], void, unknown>;

				return {
					subscription: test(),
					unsubscribe() {
						send({ uid, type: 'unsubscribe' });
						delete messageHandlers[uid];
						subscribed = false;
					},
				};
			},
		};

		return wsClient;
	};
}

export class Deferred<T> {
	resolve: (value: T | PromiseLike<T>) => void;
	reject: (reason?: any) => void;
	promise: Promise<T>;
	constructor() {
		let resolveFn: (value: T | PromiseLike<T>) => void;
		let rejectFn: (reason?: any) => void;

		this.promise = new Promise((resolve, reject) => {
			resolveFn = resolve;
			rejectFn = reject;
		});

		this.resolve = resolveFn!;
		this.reject = rejectFn!;
	}
}

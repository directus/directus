import { sleep } from '@utils/sleep';
import { createClient } from 'graphql-ws';
import { EnumType, jsonToGraphQLQuery } from 'json-to-graphql-query';
import request, { type Response } from 'supertest';
import { WebSocket } from 'ws';
import type {
	WebSocketOptions,
	WebSocketOptionsGql,
	WebSocketResponse,
	WebSocketSubscriptionOptions,
	WebSocketSubscriptionOptionsGql,
	WebSocketUID,
} from './types';

export function processGraphQLJson(jsonQuery: any) {
	return jsonToGraphQLQuery(jsonQuery);
}

export async function requestGraphQL(
	host: string,
	isSystemCollection: boolean,
	token: string | null,
	jsonQuery: any,
	options?: { variables?: any; cookies?: string[] },
): Promise<Response> {
	const req = request(host)
		.post(isSystemCollection ? '/graphql/system' : '/graphql')
		.send({
			query: processGraphQLJson(jsonQuery),
			variables: options?.variables,
		});

	if (token) req.set('Authorization', `Bearer ${token}`);
	if (options?.cookies) req.set('Cookie', options.cookies);

	return await req;
}

export function calculateMessageCount(
	uid: WebSocketUID | undefined,
	messages: Record<WebSocketUID, any[]>,
	readIndexes: Record<WebSocketUID, number>,
	messagesDefault: any[],
	readIndexDefault: number,
) {
	if (uid) {
		const index = readIndexes[uid] ?? 0;
		return (messages[uid]?.length ?? 0) - index;
	} else {
		return messagesDefault.length - readIndexDefault;
	}
}

export async function waitForMatchingMessage(
	ws: { getUnreadMessageCount: () => number; getMessages: (count: number) => Promise<WebSocketResponse[] | undefined> },
	matcher: (message: WebSocketResponse) => boolean,
	timeout = 5000,
) {
	const start = Date.now();

	while (Date.now() - start < timeout) {
		const count = ws.getUnreadMessageCount();

		if (count > 0) {
			const messages = await ws.getMessages(count);

			if (messages) {
				for (const message of messages) {
					if (matcher(message)) return message;
				}
			}
		}

		await sleep(50);
	}

	throw new Error('Timeout waiting for matching message');
}

export function createWebSocketConn(host: string, config?: WebSocketOptions) {
	const defaults = { waitTimeout: 5000 };
	const parsedHost = host.split('//').slice(1).join('/');

	const conn = new WebSocket(
		`ws://${parsedHost}/${config?.path ?? 'websocket'}${config?.queryString ? `?${config.queryString}` : ''}`,
		config?.client,
	);

	let connectionAuthCompleted = false;
	const messages: Record<WebSocketUID, any[]> = {};
	const messagesDefault: WebSocketResponse[] = [];
	let readIndexDefault = 0;
	const readIndexes: Record<WebSocketUID, number> = {};

	const waitForState = (
		state: WebSocket['readyState'],
		options?: {
			waitTimeout?: number;
		},
	) => {
		const startMs = Date.now();

		const promise = () => {
			return new Promise(function (resolve, reject) {
				setTimeout(function () {
					if (
						conn.readyState === state &&
						(conn.readyState !== conn.OPEN || !config?.auth || (config.auth && connectionAuthCompleted))
					) {
						return resolve(true);
					} else if (Date.now() < startMs + (options?.waitTimeout ?? config?.waitTimeout ?? defaults.waitTimeout)) {
						return promise().then(resolve, reject);
					} else {
						let stateName = '';

						switch (state) {
							case WebSocket.CONNECTING:
								stateName = 'CONNECTING';
								break;
							case WebSocket.OPEN:
								stateName = 'OPEN';
								break;
							case WebSocket.CLOSING:
								stateName = 'CLOSING';
								break;
							case WebSocket.CLOSED:
								stateName = 'CLOSED';
								break;
							default:
								stateName = 'INVALID';
								break;
						}

						conn.terminate();
						return reject(new Error(`WebSocket failed to achieve the ${stateName} state`));
					}
				}, 5);
			});
		};

		return promise();
	};

	const getMessages = async (
		messageCount: number,
		options?: {
			waitTimeout?: number;
			targetState?: WebSocket['readyState'];
			uid?: WebSocketUID | undefined;
			startIndex?: number;
		},
	): Promise<WebSocketResponse[] | undefined> => {
		const targetMessages = options?.uid ? (messages[options.uid] ?? (messages[options.uid] = [])) : messagesDefault;
		let startMessageIndex: number;

		if (options?.startIndex) {
			startMessageIndex = options.startIndex;
		} else if (options?.uid) {
			startMessageIndex = readIndexes[options.uid] ?? 0;
		} else {
			startMessageIndex = readIndexDefault;
		}

		const endMessageIndex = startMessageIndex + messageCount;

		if (options?.uid) {
			readIndexes[String(options.uid)] = endMessageIndex;
		} else {
			readIndexDefault = endMessageIndex;
		}

		await waitForState(options?.targetState ?? WebSocket.OPEN);
		const startMs = Date.now();

		const promise = (): Promise<WebSocketResponse[] | undefined> => {
			return new Promise(function (resolve, reject) {
				setTimeout(function () {
					if (targetMessages.length >= endMessageIndex) {
						resolve(targetMessages.slice(startMessageIndex, endMessageIndex));
					} else if (Date.now() < startMs + (options?.waitTimeout ?? config?.waitTimeout ?? defaults.waitTimeout)) {
						return promise().then(resolve, reject);
					} else {
						conn.terminate();

						return reject(
							new Error(
								`Missing message${options?.uid ? ` for "${String(options.uid)}"` : ''} (received ${
									targetMessages.length - startMessageIndex
								}/${messageCount})`,
							),
						);
					}
				}, 5);
			});
		};

		return promise();
	};

	const getMessageCount = (uid?: WebSocketUID) => {
		if (uid) {
			return messages[uid]?.length ?? 0;
		} else {
			return messagesDefault.length;
		}
	};

	const getUnreadMessageCount = (uid?: WebSocketUID) => {
		return calculateMessageCount(uid, messages, readIndexes, messagesDefault, readIndexDefault);
	};

	const sendMessage = async (
		message: Record<string, any>,
		options?: {
			uid?: WebSocketUID;
			callback?: () => void;
		},
	) => {
		await waitForState(WebSocket.OPEN);
		conn.send(JSON.stringify(message), options?.callback);
	};

	const subscribe = async (options: WebSocketSubscriptionOptions) => {
		if (options.uid && !messages[options.uid]) messages[options.uid] = [];
		sendMessage({ type: 'subscribe', ...options });
		let response;
		let error;

		try {
			response = await getMessages(1, { uid: options.uid });
		} catch (err) {
			error = err;
		}

		if (error || !response || response[0]?.status === 'error') {
			throw new Error(`Unable to subscribe to "${options.collection}"${options.uid ? ` for "${options.uid}"` : ''}`);
		}

		return response[0];
	};

	const unsubscribe = async (uid?: WebSocketUID) => {
		await sendMessage({ type: 'unsubscribe', uid });
		let response;
		let error;

		try {
			response = await getMessages(1, { uid });
		} catch (err) {
			error = err;
		}

		if (error || !response || response[0]?.status === 'error') {
			throw new Error(`Unable to unsubscribe${uid ? ` to "${uid}"` : ''}`);
		}
	};

	conn.on('open', () => {
		if (config?.auth) {
			if ('email' in config.auth) {
				conn.send(JSON.stringify({ type: 'auth', email: config.auth.email, password: config.auth.password }));
			} else if ('access_token' in config.auth) {
				conn.send(JSON.stringify({ type: 'auth', access_token: config.auth.access_token }));
			} else if ('refresh_token' in config.auth) {
				conn.send(JSON.stringify({ type: 'auth', refresh_token: config.auth.refresh_token }));
			}
		}

		conn.on('message', (data) => {
			const message: WebSocketResponse = JSON.parse(data.toString());

			if (config?.respondToPing !== false && message.type === 'ping') {
				conn.send(JSON.stringify({ type: 'pong' }));
				return;
			}

			if (config?.auth && !connectionAuthCompleted && message.type === 'auth') {
				connectionAuthCompleted = true;
				return;
			}

			const targetMessages = message.uid ? (messages[message.uid] ?? (messages[message.uid] = [])) : messagesDefault;
			targetMessages.push(message);
		});
	});

	conn.on('error', () => {
		return;
	});

	return {
		conn,
		waitForState,
		getMessages,
		getMessageCount,
		getUnreadMessageCount,
		sendMessage,
		subscribe,
		unsubscribe,
	};
}

export function createWebSocketGql(host: string, config?: WebSocketOptionsGql) {
	const defaults = { waitTimeout: 5000 };
	const parsedHost = host.split('//').slice(1).join('/');
	let conn: WebSocket | null;
	let isConnReady = false;
	let authParams;

	if (config?.auth && 'access_token' in config.auth) {
		authParams = { access_token: config.auth.access_token };
	}

	const client = createClient({
		webSocketImpl: WebSocket,
		connectionParams: authParams,
		...config?.client,
		disablePong: !config?.respondToPing,
		url: `ws://${parsedHost}/${config?.path ?? 'graphql'}${config?.queryString ? `?${config.queryString}` : ''}`,
		on: {
			closed: () => {
				conn = null;
			},
			opened: (socket) => {
				config?.client?.on?.opened?.(socket);
				conn = socket as WebSocket;

				conn.on('message', (data) => {
					const message: WebSocketResponse = JSON.parse(data.toString());

					if (message.type === 'connection_ack') {
						isConnReady = true;
					}

					if (config?.respondToPing !== false && message.type === 'ping') {
						conn?.send(JSON.stringify({ type: 'pong' }));
						return;
					}
				});
			},
		},
	});

	const messages: Record<string, any[]> = {};
	const messagesDefault: any[] = [];
	let readIndexDefault = 0;
	const readIndexes: Record<WebSocketUID, number> = {};
	const unsubscriptions: Record<string, () => void> = {};
	let unsubscriptionDefault: () => void;

	const waitForState = (
		state: WebSocket['readyState'],
		options?: {
			waitTimeout?: number;
		},
	) => {
		const startMs = Date.now();

		const promise = () => {
			return new Promise(function (resolve, reject) {
				setTimeout(function () {
					if (isConnReady && conn && conn.readyState === state) {
						return resolve(true);
					} else if (Date.now() < startMs + (options?.waitTimeout ?? config?.waitTimeout ?? defaults.waitTimeout)) {
						return promise().then(resolve, reject);
					} else {
						let stateName = '';

						switch (state) {
							case WebSocket.CONNECTING:
								stateName = 'CONNECTING';
								break;
							case WebSocket.OPEN:
								stateName = 'OPEN';
								break;
							case WebSocket.CLOSING:
								stateName = 'CLOSING';
								break;
							case WebSocket.CLOSED:
								stateName = 'CLOSED';
								break;
							default:
								stateName = 'INVALID';
								break;
						}

						conn?.terminate();
						return reject(new Error(`WebSocket failed to achieve the ${stateName} state`));
					}
				}, 5);
			});
		};

		return promise();
	};

	const getMessages = async (
		messageCount: number,
		options?: {
			waitTimeout?: number;
			targetState?: WebSocket['readyState'];
			uid?: WebSocketUID;
			startIndex?: number;
		},
	): Promise<WebSocketResponse[] | undefined> => {
		const targetMessages = options?.uid ? (messages[options.uid] ?? (messages[options.uid] = [])) : messagesDefault;
		let startMessageIndex: number;

		if (options?.startIndex) {
			startMessageIndex = options.startIndex;
		} else if (options?.uid) {
			startMessageIndex = readIndexes[options.uid] ?? 0;
		} else {
			startMessageIndex = readIndexDefault;
		}

		const endMessageIndex = startMessageIndex + messageCount;

		if (options?.uid) {
			readIndexes[String(options.uid)] = endMessageIndex;
		} else {
			readIndexDefault = endMessageIndex;
		}

		await waitForState(options?.targetState ?? WebSocket.OPEN);
		const startMs = Date.now();

		const promise = (): Promise<WebSocketResponse[] | undefined> => {
			return new Promise(function (resolve, reject) {
				setTimeout(function () {
					if (targetMessages.length >= endMessageIndex) {
						resolve(targetMessages.slice(startMessageIndex, endMessageIndex));
					} else if (Date.now() < startMs + (options?.waitTimeout ?? config?.waitTimeout ?? defaults.waitTimeout)) {
						return promise().then(resolve, reject);
					} else {
						conn?.terminate();

						return reject(
							new Error(
								`Missing message${options?.uid ? ` for "${String(options.uid)}"` : ''} (received ${
									targetMessages.length - startMessageIndex
								}/${messageCount})`,
							),
						);
					}
				}, 5);
			});
		};

		return promise();
	};

	const getMessageCount = (uid?: WebSocketUID) => {
		if (uid) {
			return messages[uid]?.length ?? 0;
		} else {
			return messagesDefault.length;
		}
	};

	const getUnreadMessageCount = (uid?: WebSocketUID) => {
		return calculateMessageCount(uid, messages, readIndexes, messagesDefault, readIndexDefault);
	};

	const subscribe = async (options: WebSocketSubscriptionOptionsGql) => {
		const targetMessages = options.uid ? (messages[options.uid] ?? (messages[options.uid] = [])) : messagesDefault;
		const subscriptionKey = `${options.collection}_mutated`;

		const onNext = (data: any) => {
			targetMessages.push(data);
		};

		const args = options.event ? { __args: { event: new EnumType(options.event) } } : false;

		const unsubscribe = client.subscribe(
			{
				query: processGraphQLJson({
					subscription: { [subscriptionKey]: { ...args, ...options.jsonQuery } },
				}),
			},
			{
				next: onNext,
				error: () => {
					return;
				},
				complete: () => {
					return;
				},
			},
		);

		if (options.uid) {
			unsubscriptions[options.uid] = unsubscribe;
		} else {
			unsubscriptionDefault = unsubscribe;
		}

		await waitForState(WebSocket.OPEN);
		return subscriptionKey;
	};

	const unsubscribe = (uid?: WebSocketUID) => {
		if (uid) {
			unsubscriptions[uid]?.();
		} else if (unsubscriptionDefault) {
			unsubscriptionDefault();
		}
	};

	return {
		client,
		getMessages,
		getMessageCount,
		getUnreadMessageCount,
		subscribe,
		unsubscribe,
		waitForState,
	};
}

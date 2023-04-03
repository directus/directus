import request from 'supertest';
import { jsonToGraphQLQuery } from 'json-to-graphql-query';
import { WebSocket } from 'ws';
import { WebSocketOptions, WebSocketResponse, WebSocketSubscriptionOptions, WebSocketUID } from './types';

export function processGraphQLJson(jsonQuery: any) {
	return jsonToGraphQLQuery(jsonQuery);
}

export async function requestGraphQL(
	host: string,
	isSystemCollection: boolean,
	token: string | null,
	jsonQuery: any,
	variables?: any
): Promise<any> {
	const req = request(host)
		.post(isSystemCollection ? '/graphql/system' : '/graphql')
		.send({
			query: processGraphQLJson(jsonQuery),
			variables,
		});

	if (token) req.set('Authorization', `Bearer ${token}`);

	return await req;
}

export function createWebSocketConn(host: string, config?: WebSocketOptions) {
	const defaults = { waitTimeout: 5000 };
	const parsedHost = host.split('//').slice(1).join('/');
	const conn = new WebSocket(
		`ws://${parsedHost}/${config?.path ?? 'websocket'}${config?.queryString ? `?${config.queryString}` : ''}`,
		config?.client
	);
	let connectionAuthCompleted = false;
	const rawMessages: WebSocketResponse[] = [];
	let readIndexDefault = 0;
	const readIndexes: Record<WebSocketUID, number> = {};
	const waitForState = (
		state: WebSocket['readyState'],
		options?: {
			waitTimeout?: number;
		}
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
							case conn.CONNECTING:
								stateName = 'CONNECTING';
								break;
							case conn.OPEN:
								stateName = 'OPEN';
								break;
							case conn.CLOSING:
								stateName = 'CLOSING';
								break;
							case conn.CLOSED:
								stateName = 'CLOSED';
								break;
							default:
								stateName = 'INVALID';
								break;
						}
						conn.close();
						reject(new Error(`WebSocket failed to achieve the ${stateName} state`));
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
		}
	): Promise<WebSocketResponse[] | undefined> => {
		const startMessageIndex = options?.uid ? readIndexes[options.uid] ?? 0 : readIndexDefault;
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
					const filteredMessages = rawMessages.filter((message: WebSocketResponse) => {
						if (!options?.uid && !message.uid) return true;
						if (options?.uid && message.uid === String(options.uid)) {
							return true;
						}
					});
					if (filteredMessages.length >= endMessageIndex) {
						resolve(filteredMessages.slice(startMessageIndex, endMessageIndex));
					} else if (Date.now() < startMs + (options?.waitTimeout ?? config?.waitTimeout ?? defaults.waitTimeout)) {
						return promise().then(resolve, reject);
					} else {
						conn.close();
						reject(
							new Error(
								`Missing message${options?.uid ? ` for "${String(options.uid)}"` : ''} (received ${
									filteredMessages.length - startMessageIndex
								}/${messageCount})`
							)
						);
					}
				}, 5);
			});
		};
		return promise();
	};
	const sendMessage = async (
		message: Record<string, any>,
		options?: {
			uid?: WebSocketUID;
			callback?: () => void;
		}
	) => {
		await waitForState(WebSocket.OPEN);
		conn.send(JSON.stringify(message), options?.callback);
	};
	const subscribe = async (options: WebSocketSubscriptionOptions) => {
		sendMessage({ type: 'subscribe', ...options });
		let response;
		let error;
		try {
			response = await getMessages(1, { uid: options.uid });
		} catch (err) {
			error = err;
		}
		if (error || !response || response[0].status === 'error') {
			throw new Error(`Unable to subscribe to "${options.collection}"${options.uid ? ` for "${options.uid}"` : ''}`);
		}
		return response[0];
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

			rawMessages.push(message);
		});
	});

	conn.on('error', () => {
		return;
	});

	return { conn, rawMessages, waitForState, getMessages, sendMessage, subscribe };
}

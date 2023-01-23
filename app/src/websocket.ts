import {
	MessageCallback,
	MessageType,
	PrimaryKey,
	SubscribeOptions,
	WebSocketClient,
	WebSocketWrapper,
} from '@directus/shared/types';
import api from './api';

const uidCounter = (function* () {
	let i = 0;
	while (true) {
		yield i++;
	}
})();

let ws: WebSocket | null = null;
let authenticated = false;

const onMessageResponse = new Map<number, MessageCallback>();
const onMessageCallbacks = new Set<MessageCallback>([]);
const onAuthCallbacks = new Set<() => void>();
const oncloseCallbacks = new Set<() => void>();

function connectWebSocket() {
	ws = new WebSocket('ws://localhost:8055/websocket');

	ws.onopen = async () => {
		if (ws === null) return;
		await authenticate(ws);
	};

	ws.onmessage = (event) => {
		if (ws === null) return;

		const message = JSON.parse(event.data);
		const type = message['type'].toUpperCase();
		const uid = 'uid' in message ? message['uid'] : undefined;

		// console.log('messageRecieved', message);

		switch (type) {
			case 'PING':
				ws.send(JSON.stringify({ type: 'PONG' }));
				break;
		}

		if (uid !== undefined) {
			const callback = onMessageResponse.get(uid);
			if (callback !== undefined) callback(message);
		}
		for (const callback of onMessageCallbacks) {
			callback(message);
		}
	};

	ws.onclose = () => {
		oncloseCallbacks.forEach((callback) => callback());
		retryConnection();
	};

	ws.onerror = (_error) => {
		// console.error(error);
		ws?.close();
	};
}
let retryTimeout: NodeJS.Timeout | null = null;
function retryConnection() {
	// console.log('Retrying connection in 10 seconds');

	if (retryTimeout !== null) return;

	ws?.close();
	ws = null;

	retryTimeout = setTimeout(() => {
		connectWebSocket();
		retryTimeout = null;
	}, 10_000);
}

async function authenticate(ws: WebSocket) {
	const token = api.defaults.headers.common['Authorization']?.substring(7);
	const client = new Client(ws);

	if (!token) {
		retryConnection();
		return;
	}

	// console.log('Authenticating with token', token);

	try {
		authenticated = true;

		const response = await client.send('AUTH', {
			access_token: token,
		});
		// console.log('Authenticated', response);

		if (response?.['status'] === 'ok') {
			onAuthCallbacks.forEach((callback) => callback());
		}

		if (response?.['status'] === 'error') {
			// console.error('Authentication failed', response['error']);
			//TODO: Handle token expiration
			authenticated = false;
		}
	} catch (error) {
		// console.error(error);
		authenticated = false;
	}
}

connectWebSocket();

export function getWebSocket() {
	return new Wrapper();
}

export class Wrapper implements WebSocketWrapper {
	connectCallbacks = new Set<(client: WebSocketClient) => void>();
	disconnectCallbacks = new Set<() => void>();

	constructor() {
		onAuthCallbacks.add(() => {
			this.connectCallbacks.forEach((callback) => callback(new Client(ws!)));
		});
		oncloseCallbacks.add(() => {
			this.disconnectCallbacks.forEach((callback) => callback());
		});
	}

	onConnect(callback: (client: WebSocketClient) => void) {
		this.connectCallbacks.add(callback);

		if (authenticated) {
			callback(new Client(ws!));
		}
	}

	onDisconnect(callback: () => void) {
		this.disconnectCallbacks.add(callback);
	}
}

class Client implements WebSocketClient {
	ws: WebSocket;

	constructor(ws: WebSocket) {
		this.ws = ws;
	}

	listen(callback: MessageCallback) {
		onMessageCallbacks.add(callback);
		return () => onMessageCallbacks.delete(callback);
	}
	subscribe(options: SubscribeOptions, callback: MessageCallback) {
		const counter = uidCounter.next().value;

		onMessageResponse.set(counter, callback);
		const data: Record<string, any> = {
			type: 'SUBSCRIBE',
			uid: counter,
			...options,
		};

		if (options.item) data['item'] = options.item;
		if (options.query) data['query'] = options.query;

		this.ws.send(JSON.stringify(data));

		return counter;
	}
	focus(collection: string, item?: PrimaryKey, field?: string) {
		const data: Record<string, any> = {
			type: 'FOCUS',
			collection,
		};

		if (item) data['item'] = item;
		if (field) data['field'] = field;

		this.ws.send(JSON.stringify(data));
	}

	unsubscribe(uid: number) {
		onMessageResponse.delete(uid);
		this.ws.send(JSON.stringify({ type: 'UNSUBSCRIBE', uid }));
	}

	send(type: MessageType, data: Record<string, any> = {}, timeout: number | false = 5000) {
		if (timeout === false) {
			// dont wait for response
			return this.ws.send(JSON.stringify({ ...data, type }));
		}

		const counter = uidCounter.next().value;
		return new Promise<Record<string, any>>((resolve, reject) => {
			onMessageResponse.set(counter, (data) => {
				onMessageResponse.delete(counter);
				resolve(data);
			});

			setTimeout(() => {
				if (onMessageResponse.has(counter)) reject(new Error(`Timeout while waiting for ${type} response`));
			}, timeout);

			this.ws.send(JSON.stringify({ ...data, type, uid: counter }));
		});
	}
}

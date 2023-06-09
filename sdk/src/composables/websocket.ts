import type { DirectusClient } from '../client.js';
import NativeWS from 'ws';
import { withoutTrailingSlash } from '../utils.js';

interface WebSocketConfig {
	url: string;
}

interface WebSocketClientConfig {
	socketURL: string;
}

type WebSocketStatus = 'OPEN' | 'CLOSED';

interface WebSocketClient {
	config: WebSocketClientConfig;
	ws: {
		status: WebSocketStatus;
		socket?: NativeWS;
	};
	connect(): void;
	message(): void;
	subscribe(collection: string): void;
}

export function WebSocket(cfg: WebSocketConfig) {
	return <Client extends DirectusClient>(client: Client) => {
		const wsClient: WebSocketClient = {
			config: {
				socketURL: withoutTrailingSlash(cfg.url),
			},
			ws: {
				status: 'CLOSED',
			},
			connect() {
				if (this.ws.status === 'OPEN') return;
				const url = this.config.socketURL;
				const WS = client.config.ws ?? NativeWS;
				this.ws.socket = new WS(url);
			},
			message() {
				// test
			},
			subscribe(collection) {
				// console.log(`subscribe(${collection})`);
			},
		};

		return wsClient;
	};
}

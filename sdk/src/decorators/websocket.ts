import type { DirectusClient } from '../client.js';

interface WebSocketClient {
	ws: {
		url: string;
	};
	subscribe(collection: string): void;
}

export function withWebSocket(_cfg: WebSocketClient['ws']) {
	return <S extends object, F extends object>(client: DirectusClient<S, F>) => {
		const wsClient: WebSocketClient = {
			ws: _cfg,
			subscribe(collection) {
				console.log(`subscribe(${collection})`);
			},
		};

		return {
			...client,
			...wsClient,
		} as DirectusClient<S, F & WebSocketClient>;
	};
}

/// OLD ATTEMPT
// export type WebSocketClientConfig = {
// 	url: string;
// 	// requestTimeout?: number;
// 	// reconnect?: false | {  };
// };

// export type WebSocketClient<Schema extends object = any> = DirectusClient<Schema> & {
// 	socketConfig: WebSocketClientConfig;
// 	subscribe(): void;
// 	exec: <InputType extends InputTypes, OutputType extends OutputTypes>(
// 		command: Command<InputType, OutputType, WebSocketClient, Schema>
// 	) => Promise<OutputType>;
// };

// export const withWebSocket = <Schema extends object = any>(
// 	client: DirectusClient<Schema>,
// 	config: WebSocketClientConfig
// ): WebSocketClient<Schema> => {
// 	const exec: WebSocketClient<Schema>['exec'] = async (command) => {
// 		return await command(newClient);
// 	};

// 	const newClient: WebSocketClient<Schema> = {
// 		...client,
// 		socketConfig: config,
// 		subscribe() {
// 			console.log('test');
// 		},
// 		exec,
// 	};

// 	return newClient;
// };
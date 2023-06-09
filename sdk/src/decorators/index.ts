import type { DirectusClient } from '../client.js';

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

export function withWebSocket<S extends object, T, F>(_cfg: any) {
	return (client: T) => {
		console.log('ws');
		return client as DirectusClient<S, F & { websocket: true }>;
	};
}

// placeholders
export function withHttpAuthentication() {}

export function withWebSocketAuthentication() {}

export function withGraphQL(client: DirectusClient, _cfg: any) {
	// return {
	// 	name: 'gql',
	// 	register: () => console.log('gql'),
	// };
}

export function withSubscriptions() {}

export function withPagination() {}

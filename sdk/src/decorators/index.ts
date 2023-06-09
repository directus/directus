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

export function withWebSocket(_cfg: any) {
	return <S extends object, F>(client: DirectusClient<S, F>) => {
		console.log('ws');
		return client as DirectusClient<S, F extends null ? 'WebSocket' : F | 'WebSocket'>;
	};
}

// placeholders
export function withHttpAuthentication() {}

export function withWebSocketAuthentication() {}

export function withGraphQL(_cfg: any) {
	return <S extends object, F>(client: DirectusClient<S, F>) => {
		console.log('gql');
		return client as DirectusClient<S, F extends null ? 'GraphQL' : F | 'GraphQL'>;
	};
}

export function withSubscriptions() {}

export function withPagination() {}

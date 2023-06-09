import type { DirectusClient, DirectusClientConfig } from '../client.js';

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

interface WebSocketClient {
	websocket: any;
	subscribe(collection: string): void;
}

export function withWebSocket(_cfg: any) {
	return <S extends object, F extends object>(client: DirectusClient<S, F>) => {
		console.log('ws');
		return client as unknown as DirectusClient<S, F & WebSocketClient>;
	};
}

// placeholders
export function withHttpAuthentication() {}

export function withWebSocketAuthentication() {}

interface GraphQLClient {
	graphql(query: string): any;
}

export function withGraphQL(_cfg: any) {
	return <S extends object, F extends object>(client: DirectusClient<S, F>) => {
		console.log('gql');
		return client as unknown as DirectusClient<S, F & GraphQLClient>;
	};
}

export function withSubscriptions() {}

export function withPagination() {}

export type AddFeature<F, N> = F extends {} ? N : F & N;

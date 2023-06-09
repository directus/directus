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

// placeholders
export function withHttpAuthentication() {}

export function withWebSocketAuthentication() {}

interface GraphQLClient {
	gql: {
		path?: string;
	};
	graphql(query: string): any;
}

export function withGraphQL(_cfg: GraphQLClient['gql']) {
	return <S extends object, F extends object>(client: DirectusClient<S, F>) => {
		const gqlClient: GraphQLClient = {
			gql: _cfg,
			graphql(query) {
				console.log(`graphql(${query})`);
			},
		};

		return {
			...client,
			...gqlClient,
		} as DirectusClient<S, F & GraphQLClient>;
	};
}

export function withSubscriptions() {}

export function withPagination() {}

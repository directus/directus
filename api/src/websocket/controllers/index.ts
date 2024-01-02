import type { Server as httpServer } from 'http';
import { useEnv } from '../../env.js';
import { toBoolean } from '../../utils/to-boolean.js';
import { GraphQLSubscriptionController } from './graphql.js';
import { WebSocketController } from './rest.js';

let websocketController: WebSocketController | undefined;
let subscriptionController: GraphQLSubscriptionController | undefined;

export function createWebSocketController(server: httpServer) {
	const env = useEnv();

	if (toBoolean(env['WEBSOCKETS_REST_ENABLED'])) {
		websocketController = new WebSocketController(server);
	}
}

export function getWebSocketController() {
	return websocketController;
}

export function createSubscriptionController(server: httpServer) {
	const env = useEnv();

	if (toBoolean(env['WEBSOCKETS_GRAPHQL_ENABLED'])) {
		subscriptionController = new GraphQLSubscriptionController(server);
	}
}

export function getSubscriptionController() {
	return subscriptionController;
}

export * from './graphql.js';
export * from './rest.js';

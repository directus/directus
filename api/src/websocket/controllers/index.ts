import type { Server as httpServer } from 'http';
import env from '../../env.js';
import { ServiceUnavailableException } from '../../index.js';
import { toBoolean } from '../../utils/to-boolean.js';
import { GraphQLSubscriptionController } from './graphql.js';
import { WebSocketController } from './rest.js';

let websocketController: WebSocketController | undefined;
let subscriptionController: GraphQLSubscriptionController | undefined;

export function createWebSocketController(server: httpServer) {
	if (toBoolean(env['WEBSOCKETS_REST_ENABLED'])) {
		websocketController = new WebSocketController(server);
	}
}

export function getWebSocketController() {
	if (!toBoolean(env['WEBSOCKETS_ENABLED']) || !toBoolean(env['WEBSOCKETS_REST_ENABLED'])) {
		throw new ServiceUnavailableException('WebSocket server is disabled', {
			service: 'get-websocket-controller',
		});
	}

	if (!websocketController) {
		throw new ServiceUnavailableException('WebSocket server is not initialized', {
			service: 'get-websocket-controller',
		});
	}

	return websocketController;
}

export function createSubscriptionController(server: httpServer) {
	if (toBoolean(env['WEBSOCKETS_GRAPHQL_ENABLED'])) {
		subscriptionController = new GraphQLSubscriptionController(server);
	}
}

export function getSubscriptionController() {
	return subscriptionController;
}

export * from './graphql.js';
export * from './rest.js';

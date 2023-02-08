import type { Server as httpServer } from 'http';
import { ServiceUnavailableException } from '../../exceptions';
import { GraphQLSubscriptionController } from './graphql';
import { WebsocketController } from './rest';
import env from '../../env';

let websocketController: WebsocketController | undefined;
let subscriptionController: GraphQLSubscriptionController | undefined;

export function createWebsocketController(server: httpServer) {
	if (env['WEBSOCKETS_REST_ENABLED']) {
		websocketController = new WebsocketController(server);
	}
}

export function getWebsocketController() {
	if (!env['WEBSOCKETS_ENABLED'] || !env['WEBSOCKETS_REST_ENABLED']) {
		throw new ServiceUnavailableException('Websocket server is disabled', {
			service: 'get-websocket-controller',
		});
	}
	if (!websocketController) {
		throw new ServiceUnavailableException('Websocket server is not initialized', {
			service: 'get-websocket-controller',
		});
	}
	return websocketController;
}

export function createSubscriptionController(server: httpServer) {
	if (env['WEBSOCKETS_GRAPHQL_ENABLED']) {
		subscriptionController = new GraphQLSubscriptionController(server);
	}
}

export function getSubscriptionController() {
	return subscriptionController;
}

export * from './graphql';
export * from './rest';

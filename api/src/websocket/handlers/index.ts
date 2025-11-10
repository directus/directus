import { useEnv } from '@directus/env';
import { toBoolean } from '@directus/utils';
import { HeartbeatHandler } from './heartbeat.js';
import { ItemsHandler } from './items.js';
import { LogsHandler } from './logs.js';
import { SubscribeHandler } from './subscribe.js';
import { CollabHandler } from './collab/collab.js';

export function startWebSocketHandlers() {
	const env = useEnv();

	const heartbeatEnabled = toBoolean(env['WEBSOCKETS_HEARTBEAT_ENABLED']);
	const restEnabled = toBoolean(env['WEBSOCKETS_REST_ENABLED']);
	const graphqlEnabled = toBoolean(env['WEBSOCKETS_GRAPHQL_ENABLED']);
	const logsEnabled = toBoolean(env['WEBSOCKETS_LOGS_ENABLED']);

	if (restEnabled && heartbeatEnabled) {
		new HeartbeatHandler();
	}

	if (restEnabled || graphqlEnabled) {
		new ItemsHandler();
	}

	if (restEnabled) {
		new SubscribeHandler();
	}

	if (logsEnabled) {
		new LogsHandler();
	}

	new CollabHandler();
}

export * from './heartbeat.js';
export * from './items.js';
export * from './logs.js';
export * from './subscribe.js';

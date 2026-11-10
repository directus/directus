import { useEnv } from '@directus/env';
import { CollabHandler } from '../collab/collab.js';
import { HeartbeatHandler } from './heartbeat.js';
import { ItemsHandler } from './items.js';
import { LogsHandler } from './logs.js';
import { SubscribeHandler } from './subscribe.js';

let collabHandler: CollabHandler | undefined;

export function startWebSocketHandlers() {
	const {
		WEBSOCKETS_HEARTBEAT_ENABLED,
		WEBSOCKETS_REST_ENABLED,
		WEBSOCKETS_GRAPHQL_ENABLED,
		WEBSOCKETS_LOGS_ENABLED,
		WEBSOCKETS_COLLAB_ENABLED,
	} = useEnv();

	if (WEBSOCKETS_REST_ENABLED && WEBSOCKETS_HEARTBEAT_ENABLED) {
		new HeartbeatHandler();
	}

	if (WEBSOCKETS_REST_ENABLED || WEBSOCKETS_GRAPHQL_ENABLED) {
		new ItemsHandler();
	}

	if (WEBSOCKETS_REST_ENABLED) {
		new SubscribeHandler();
	}

	if (WEBSOCKETS_LOGS_ENABLED) {
		new LogsHandler();
	}

	if (WEBSOCKETS_COLLAB_ENABLED) {
		collabHandler = new CollabHandler();
	}
}

export function getCollabHandler() {
	return collabHandler;
}

export * from './heartbeat.js';
export * from './items.js';
export * from './logs.js';
export * from './subscribe.js';

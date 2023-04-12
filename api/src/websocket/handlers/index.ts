import { ItemsHandler } from './items.js';
import { HeartbeatHandler } from './heartbeat.js';
import { SubscribeHandler } from './subscribe.js';
import { UsersHandler } from './users.js';

export function startWebSocketHandlers() {
	new HeartbeatHandler();
	new ItemsHandler();
	new SubscribeHandler();
	new UsersHandler();
}

export * from './heartbeat.js';
export * from './items.js';
export * from './subscribe.js';
export * from './users.js';

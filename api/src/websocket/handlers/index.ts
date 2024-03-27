import { HeartbeatHandler } from './heartbeat.js';
import { ItemsHandler } from './items.js';
import { SubscribeHandler } from './subscribe.js';

export function startWebSocketHandlers() {
	new HeartbeatHandler();
	new ItemsHandler();
	new SubscribeHandler();
}

export * from './heartbeat.js';
export * from './items.js';
export * from './subscribe.js';

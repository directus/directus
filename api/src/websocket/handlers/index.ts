import { HeartbeatHandler } from './heartbeat.js';
import { ItemsHandler } from './items.js';
import { LogsHandler } from './logs.js';
import { SubscribeHandler } from './subscribe.js';

export function startWebSocketHandlers() {
	new HeartbeatHandler();
	new ItemsHandler();
	new SubscribeHandler();
	new LogsHandler();
}

export * from './heartbeat.js';
export * from './items.js';
export * from './logs.js';
export * from './subscribe.js';

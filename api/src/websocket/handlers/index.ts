import { ItemsHandler } from './items';
import { HeartbeatHandler } from './heartbeat';
import { SubscribeHandler } from './subscribe';

export function startWebSocketHandlers() {
	new HeartbeatHandler();
	new ItemsHandler();
	new SubscribeHandler();
}

export * from './heartbeat';
export * from './items';
export * from './subscribe';

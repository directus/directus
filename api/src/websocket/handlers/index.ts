import env, { toBoolean } from '../../env';
import { ItemsHandler } from './items';
import { HeartbeatHandler } from './heartbeat';
import { SubscribeHandler } from './subscribe';

export function startWebsocketHandlers() {
	if (toBoolean(env['WEBSOCKETS_HEARTBEAT_ENABLED'])) {
		new HeartbeatHandler();
	}
	new ItemsHandler();
	new SubscribeHandler();
}

export * from './heartbeat';
export * from './items';
export * from './subscribe';

import env from '../../env';
import { HeartbeatHandler, ItemsHandler, SubscribeHandler } from '../handlers';

export function startWebsocketHandlers() {
	if (env['WEBSOCKETS_HEARTBEAT_ENABLED']) {
		new HeartbeatHandler();
	}
	new ItemsHandler();
	new SubscribeHandler();
}

export * from './heartbeat';
export * from './items';
export * from './subscribe';

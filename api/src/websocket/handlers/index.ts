import env from '../../env';
import { HeartbeatHandler, ItemsHandler, SubscribeHandler, UsersHandler } from '../handlers';

export function startWebsocketHandlers() {
	if (env['WEBSOCKETS_HEARTBEAT_ENABLED']) {
		new HeartbeatHandler();
	}
	new ItemsHandler();
	new SubscribeHandler();
	new UsersHandler();
}

export * from './heartbeat';
export * from './items';
export * from './subscribe';
export * from './users';

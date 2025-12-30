import { useEnv } from '@directus/env';
import * as http from 'http';

export function getAddress(server: http.Server) {
	const env = useEnv();
	const address = server.address();

	if (address === null) {
		// Before the 'listening' event has been emitted or after calling server.close()

		if (env['UNIX_SOCKET_PATH']) {
			return env['UNIX_SOCKET_PATH'];
		}

		return `${env['HOST']}:${env['PORT']}`;
	}

	if (typeof address === 'string') {
		// unix path
		return address;
	}

	return `${address.address}:${address.port}`;
}

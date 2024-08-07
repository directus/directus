import * as http from 'http';
import * as https from 'https';

export function getAddress(server: http.Server) {
	const protocol = server instanceof https.Server ? 'https' : 'http';

	const address = server.address();

	if (address === null) {
		// Before the 'listening' event has been emitted or after calling server.close()
		return;
	}

	if (typeof address === 'string') {
		// unix path
		return address;
	}

	return `${protocol}://${address.address}:${address.port}`;
}

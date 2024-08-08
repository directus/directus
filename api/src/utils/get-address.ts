import * as http from 'http';

export function getAddress(server: http.Server) {
	const address = server.address();

	if (address === null) {
		// Before the 'listening' event has been emitted or after calling server.close()
		return;
	}

	if (typeof address === 'string') {
		// unix path
		return address;
	}

	return `${address.address}:${address.port}`;
}

interface WebSocketListener {
	(data: MessageEvent<string>): any;
}

/**
 * Wait for a websocket response
 *
 * @param socket WebSocket
 *
 * @returns Incoming message object
 */
export const messageCallback = (socket: globalThis.WebSocket) =>
	new Promise<Record<string, any>>((resolve) => {
		const handler: WebSocketListener = (data) => {
			try {
				const message = JSON.parse(data.data) as Record<string, any>;

				if (typeof message === 'object' && !Array.isArray(message) && message !== null) {
					socket.removeEventListener('message', handler);
					resolve(message);
				}
			} catch (err) {
				// @TODO: either ignore or throw proper error
				// eslint-disable-next-line no-console
				console.warn('invalid message', err);
			}
		};

		socket.addEventListener('message', handler);
	});

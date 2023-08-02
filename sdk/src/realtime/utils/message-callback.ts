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
	new Promise<Record<string, any> | MessageEvent<string>>((resolve, reject) => {
		const handler: WebSocketListener = (data) => {
			try {
				const message = JSON.parse(data.data) as Record<string, any>;

				if (typeof message === 'object' && !Array.isArray(message) && message !== null) {
					socket.removeEventListener('message', handler);
					resolve(message);
				}
			} catch (err) {
				// return the original event to allow customization
				socket.removeEventListener('message', handler);
				resolve(data);
			}
		};

		socket.addEventListener('message', handler);
		socket.addEventListener('error', () => reject());
		socket.addEventListener('close', () => reject());
	});

// Generate a Promise that listens only once for an event
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

interface WebSocketListener {
	(data: MessageEvent<string>): any;
}

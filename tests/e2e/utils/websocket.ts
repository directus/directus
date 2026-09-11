/**
 * A thin wrapper around a WebSocket that buffers everything the server sends, so a test can ask
 * for the next matching message without racing the socket.
 */
export type TestSocket = {
	socket: WebSocket;
	send: (data: unknown) => void;
	/** Resolves with the next buffered or incoming message that matches, in arrival order. */
	next: (match?: (message: any) => boolean, timeout?: number) => Promise<any>;
	/** Resolves `true` when no matching message arrives within `within` ms. */
	silent: (match?: (message: any) => boolean, within?: number) => Promise<boolean>;
	close: () => void;
};

export async function openSocket(url: string, protocols?: string | string[]): Promise<TestSocket> {
	const socket = new WebSocket(url, protocols as any);

	const buffered: any[] = [];
	const waiting: { match: (message: any) => boolean; resolve: (message: any) => void }[] = [];

	socket.addEventListener('message', (event) => {
		const message = JSON.parse(String(event.data));

		const index = waiting.findIndex((waiter) => waiter.match(message));

		if (index === -1) {
			buffered.push(message);
			return;
		}

		waiting.splice(index, 1)[0]!.resolve(message);
	});

	await new Promise((resolve, reject) => {
		socket.addEventListener('open', resolve, { once: true });
		socket.addEventListener('error', reject, { once: true });
	});

	function take(match: (message: any) => boolean) {
		const index = buffered.findIndex(match);

		return index === -1 ? undefined : buffered.splice(index, 1)[0];
	}

	const next: TestSocket['next'] = (match = () => true, timeout = 10_000) => {
		const buffered = take(match);

		if (buffered) return Promise.resolve(buffered);

		return new Promise((resolve, reject) => {
			const waiter = {
				match,
				resolve: (message: any) => {
					clearTimeout(timer);
					resolve(message);
				},
			};

			const timer = setTimeout(() => {
				// Drop the waiter, so a later message is not swallowed by an expired one
				waiting.splice(waiting.indexOf(waiter), 1);
				reject(new Error('Timed out waiting for a websocket message'));
			}, timeout);

			waiting.push(waiter);
		});
	};

	const silent: TestSocket['silent'] = async (match = () => true, within = 1000) => {
		try {
			await next(match, within);
			return false;
		} catch {
			return true;
		}
	};

	return {
		socket,
		send: (data) => socket.send(JSON.stringify(data)),
		next,
		silent,
		close: () => socket.close(),
	};
}

/** Opens a socket and authenticates it with a token, returning once the server confirms. */
export async function openAuthenticatedSocket(url: string, access_token: string): Promise<TestSocket> {
	const socket = await openSocket(url);

	socket.send({ type: 'auth', access_token });

	const message = await socket.next((message) => message.type === 'auth');

	if (message.status !== 'ok') {
		throw new Error(`Websocket authentication failed: ${JSON.stringify(message)}`);
	}

	return socket;
}

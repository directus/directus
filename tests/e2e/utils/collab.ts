import { openAuthenticatedSocket, type TestSocket } from './websocket.js';

export type CollabClient = TestSocket & {
	/** Sends a `collab` message, filling in the message type. */
	collab: (message: Record<string, unknown>) => void;
	/** Resolves with the next `collab` message carrying `action`. */
	waitFor: (action: string, match?: (message: any) => boolean, timeout?: number) => Promise<any>;
	/** Resolves `true` when no matching `collab` message arrives in time. */
	quiet: (action: string, match?: (message: any) => boolean, within?: number) => Promise<boolean>;
	/** Joins an item's room and resolves with the `init`, or with the `error` the server replied with. */
	join: (collection: string, item: string | number, version?: string | null) => Promise<any>;
};

/** Opens an authenticated socket with the helpers the collaborative editing protocol needs. */
export async function openCollab(port: number, token = 'admin'): Promise<CollabClient> {
	const socket = await openAuthenticatedSocket(`ws://localhost:${port}/websocket`, token);

	const matcher = (action: string, match?: (message: any) => boolean) => (message: any) =>
		message.type === 'collab' && message.action === action && (!match || match(message));

	return {
		...socket,
		collab: (message) => socket.send({ type: 'collab', ...message }),
		waitFor: (action, match, timeout) => socket.next(matcher(action, match), timeout),
		quiet: (action, match, within) => socket.silent(matcher(action, match), within),
		join: (collection, item, version = null) => {
			socket.send({ type: 'collab', action: 'join', collection, item, version });

			return socket.next((message) => message.type === 'collab' && ['init', 'error'].includes(message.action));
		},
	};
}

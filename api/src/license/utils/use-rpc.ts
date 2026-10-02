import { randomUUID } from 'crypto';
import { useBus } from '../../bus/index.js';
import { useLogger } from '../../logger/index.js';

/** Keys of `T` that are methods */
type MethodKeys<T> = { [K in keyof T]: T[K] extends (...args: any[]) => unknown ? K : never }[keyof T];

/** Pick methods `K` of `T`  */
export type RPC<T, K extends MethodKeys<T> = MethodKeys<T>> = {
	[M in K]: T[M] extends (...args: infer A) => unknown ? (...args: A) => Promise<void> : never;
};

/**
 * Call functions on other instances as if they were local (remote procedure call).
 * The calling instance is skipped.
 */
export async function useRPC<T, K extends MethodKeys<T> = MethodKeys<T>>(self: T, channel: string): Promise<RPC<T, K>> {
	const uid = randomUUID();
	const messenger = useBus();

	await messenger.subscribe<{ uid: string; method: string; args: any[] }>(
		channel,
		async ({ uid: id, method, args }) => {
			if (uid == id) return;

			const fn = (self as any)[method];

			if (typeof fn !== 'function') {
				useLogger().warn(`Ignoring unknown RPC method "${method}" on "${channel}"`);
				return;
			}

			try {
				await fn.apply(self, args);
			} catch (error) {
				// Otherwise an instance that fails a call falls behind silently
				useLogger().warn(error, `RPC "${method}" on "${channel}" failed`);
			}
		},
	);

	return new Proxy({} as any, {
		get(_, method) {
			// Not thenable, awaiting would publish a `then` call nobody answers and hang
			if (typeof method !== 'string' || method === 'then') return undefined;

			return (...args: any) => messenger.publish(channel, { uid, method, args });
		},
	});
}

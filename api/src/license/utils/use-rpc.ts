import { randomUUID } from 'crypto';
import { useBus } from '../../bus/index.js';
import { useLogger } from '../../logger/index.js';

/* eslint-disable @typescript-eslint/no-unsafe-function-type */

type PickMatching<T, V> = { [K in keyof T as T[K] extends V ? K : never]: T[K] };

export type ExtractMethods<T> = PickMatching<T, Function>;

/**
 * RPC means remote procedure call, allowing to call functions across multiple instances in a code native manner.
 *
 * Does not call the function on its OWN instance
 */
export async function useRPC<C>(self: C, channel: string): Promise<ExtractMethods<C>> {
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
				// An instance that cannot apply a call is left behind silently otherwise
				useLogger().warn(error, `RPC "${method}" on "${channel}" failed`);
			}
		},
	);

	return new Proxy({} as any, {
		get(_, method) {
			// Awaiting this proxy would triggers a publish call with `then` with nothing to respond leaving it to hang
			if (typeof method !== 'string' || method === 'then') return undefined;

			return (...args: any) => messenger.publish(channel, { uid, method, args });
		},
	});
}

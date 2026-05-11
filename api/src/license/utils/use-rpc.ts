import { randomUUID } from 'crypto';
import { useBus } from '../../bus/index.js';

/* eslint-disable @typescript-eslint/no-unsafe-function-type */

type PickMatching<T, V> = { [K in keyof T as T[K] extends V ? K : never]: T[K] };

type ExtractMethods<T> = PickMatching<T, Function>;

/**
 * RPC means remote procedure call, allowing to call functions across multiple instances in a code native manner.
 *
 * Does not call the function on its OWN instance
 */
export function useRPC<C>(self: C, channel: string): ExtractMethods<C> {
	const uid = randomUUID();
	const messenger = useBus();

	messenger.subscribe<{ uid: string; method: string; args: any[] }>(channel, ({ uid: id, method, args }) => {
		if (uid == id) return;

		(self as any)[method].call(args);
	});

	return new Proxy({} as any, {
		get(_, method) {
			return async (...args: any) => {
				messenger.publish(channel, { uid, method, args });
			};
		},
	});
}

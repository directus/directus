import { randomUUID } from 'crypto';
import { useBus } from '../bus/index.js';

/* eslint-disable @typescript-eslint/no-unsafe-function-type */

type PickMatching<T, V> = { [K in keyof T as T[K] extends V ? K : never]: T[K] };

type ExtractMethods<T> = PickMatching<T, Function>;

export function useRPC<C>(self: C, channel: string): ExtractMethods<C> {
	const uid = randomUUID();
	const messenger = useBus();

	messenger.subscribe<{ uid: string; method: string; args: any[] }>(channel, ({ uid: id, method, args }) => {
		if (uid == id) return;

		(self as any)[method].call(args);
	});

	return new Proxy(self as any, {
		async apply(_, method, args) {
			messenger.publish(channel, { uid, method, args });

			await (self as any)[method].call(args);
		},
	});
}

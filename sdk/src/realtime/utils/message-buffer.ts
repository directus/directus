/**
 * A push/pull queue for incoming websocket subscription messages.
 */
export interface MessageBuffer<T> {
	push(message: T): void;
	fail(reason: unknown): void;
	end(options?: { discard?: boolean }): void;
	next(): Promise<T | undefined>;
}

export function createMessageBuffer<T>(): MessageBuffer<T> {
	const queue: T[] = [];
	let pending: { resolve: (value: T | undefined) => void; reject: (reason?: unknown) => void } | null = null;
	let ended = false;
	let failure: { reason: unknown } | null = null;

	const settle = () => {
		if (!pending) return;

		if (failure) {
			const { reject } = pending;
			pending = null;
			reject(failure.reason);
		} else if (queue.length) {
			const { resolve } = pending;
			pending = null;
			resolve(queue.shift());
		} else if (ended) {
			const { resolve } = pending;
			pending = null;
			resolve(undefined);
		}
	};

	return {
		push(message) {
			if (ended || failure) return;
			queue.push(message);
			settle();
		},
		fail(reason) {
			if (failure) return;
			failure = { reason };
			settle();
		},
		end({ discard = false } = {}) {
			ended = true;
			if (discard) queue.length = 0;
			settle();
		},
		next() {
			return new Promise<T | undefined>((resolve, reject) => {
				pending = { resolve, reject };
				settle();
			});
		},
	};
}

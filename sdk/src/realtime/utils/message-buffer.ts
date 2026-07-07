/**
 * A push/pull queue for incoming websocket subscription messages.
 *
 * Messages are captured via `push()` as soon as they arrive and handed to a consumer when it calls
 * `next()`. If nothing is buffered yet, `next()` parks until a message arrives, the queue fails, or
 * it is ended. This decouples arrival from consumption so that messages arriving between pulls -
 * most notably the initial `init` message the server sends before any event - are never dropped.
 *
 * A single consumer is assumed (async generators serialize their `next()` calls), so only one
 * pending pull is tracked at a time.
 */
export interface MessageBuffer<T> {
	/** Queue an incoming message, delivering it to a parked consumer if there is one. */
	push(message: T): void;
	/** Reject the current (and next) pull with the given reason. */
	fail(reason: unknown): void;
	/** End the stream: once drained, `next()` resolves `undefined`. Pass `discard` to drop what's buffered. */
	end(options?: { discard?: boolean }): void;
	/** Resolve the next queued message, or `undefined` once the stream has ended. */
	next(): Promise<T | undefined>;
}

export function createMessageBuffer<T>(): MessageBuffer<T> {
	const queue: T[] = [];
	let pending: { resolve: (value: T | undefined) => void; reject: (reason?: unknown) => void } | null = null;
	let ended = false;
	let failure: { reason: unknown } | null = null;

	// Hand the parked consumer whatever is available now: the failure, the next queued message, or
	// `undefined` if the stream has ended. Otherwise leave it parked until something arrives.
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

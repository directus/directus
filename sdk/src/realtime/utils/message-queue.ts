/**
 * A single consumer queue. Messages pushed while nobody is pulling are kept in order, and a pull
 * waits until the next message arrives, so nothing is lost between pulls.
 */
export interface MessageQueue<T> {
	/** Queue a message for the consumer. */
	push(message: T): void;
	/** No more messages are coming: the consumer drains what is queued and then completes. */
	end(): void;
	/** The consumer is done: drop whatever is queued and complete immediately. */
	dispose(reason?: unknown): void;
	/** The consumer. Async generators serialize `next()` calls */
	stream(): AsyncGenerator<T, void, unknown>;
}

/**
 * Creates a message queue.
 *
 * @param onEnd Called once when the stream is over, whether it ended, failed, was disposed or the
 * consumer stopped iterating. Use it to release whatever is feeding the queue.
 */
export function createMessageQueue<T>(onEnd?: () => void): MessageQueue<T> {
	const messages: T[] = [];
	let wake: (() => void) | undefined;
	let ended = false;
	let failure: { reason: unknown } | undefined;

	const notify = () => {
		wake?.();
		wake = undefined;
	};

	const end = () => {
		if (ended) return;
		ended = true;
		notify();
		onEnd?.();
	};

	return {
		push(message) {
			if (ended) return;
			messages.push(message);
			notify();
		},
		end,
		dispose(reason?: unknown) {
			if (reason && failure === undefined) {
				failure = { reason };
			}

			messages.length = 0;
			end();
		},
		async *stream() {
			try {
				while (true) {
					while (messages.length > 0) {
						yield messages.shift()!;
					}

					if (failure) throw failure.reason;
					if (ended) return;

					await new Promise<void>((resolve) => {
						wake = resolve;
					});
				}
			} finally {
				end();
			}
		},
	};
}

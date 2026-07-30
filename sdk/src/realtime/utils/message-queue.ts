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
 * How many messages a queue holds while the consumer is behind. Past this the oldest are dropped,
 * so a consumer that never pulls cannot grow the queue without bound.
 */
export const MAX_QUEUED_MESSAGES = 1000;

export interface MessageQueueOptions {
	/** Maximum number of messages to hold. Defaults to {@link MAX_QUEUED_MESSAGES}. */
	limit?: number;
	/**
	 * Called once when the stream is over, whether it ended, failed, was disposed or the consumer
	 * stopped iterating. Use it to release whatever is feeding the queue.
	 */
	onEnd?: () => void;
	/** Called with the running total whenever a message is dropped to stay within the limit. */
	onDrop?: (dropped: number) => void;
}

/**
 * Creates a message queue.
 */
export function createMessageQueue<T>({
	limit = MAX_QUEUED_MESSAGES,
	onEnd,
	onDrop,
}: MessageQueueOptions = {}): MessageQueue<T> {
	const messages: T[] = [];
	let wake: (() => void) | undefined;
	let ended = false;
	let dropped = 0;
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

			// Keep the most recent messages: a consumer that is behind is better served by current
			// state than by a backlog it will never catch up on.
			while (messages.length > limit) {
				messages.shift();
				onDrop?.(++dropped);
			}

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

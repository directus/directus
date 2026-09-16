import { useBus } from '../../bus/index.js';
import { useLogger } from '../../logger/index.js';
import { withTimeout } from './with-timeout.js';

/**
 * Subscribes to a bus channel and waits for the next accepted message.
 *
 * The subscription is automatically removed on any "done" (message is accepted, timeout expires, etc) event
 *
 * @param channel Bus channel to subscribe to.
 * @param options Wait options.
 * @param options.timeout Maximum time to wait for an accepted message.
 * @param options.idleTimeout Maximum time to wait between messages of any kind.
 * @param options.accept Which message ends the wait, defaults to the next message.
 *
 */
export async function waitForBusMessage<T, Accepted extends T = T>(
	channel: string,
	options?: {
		timeout?: number;
		idleTimeout?: number;
		accept?: (payload: T) => payload is Accepted;
	},
) {
	const bus = useBus();
	const timeout = options?.timeout ?? 10_000;
	const idleTimeout = options?.idleTimeout;
	const accept = options?.accept ?? ((_payload: T): _payload is Accepted => true);

	let resolveMessage: (payload: Accepted) => void;
	let rejectMessage: (error: Error) => void;

	const messagePromise = new Promise<Accepted>((res, rej) => {
		resolveMessage = res;
		rejectMessage = rej;
	});

	let idleTimer: NodeJS.Timeout | undefined;

	// Only account for idle once done is triggered
	let waiting = false;

	function armIdleTimer() {
		if (idleTimeout === undefined) return;

		clearTimeout(idleTimer);

		idleTimer = setTimeout(
			() => rejectMessage(new Error(`Stalled after ${idleTimeout}ms without message on ${channel}`)),
			idleTimeout,
		);
	}

	const onMessage = (payload: T) => {
		// Any message indicates publisher as still alive, extend lifetime
		if (waiting) armIdleTimer();

		if (accept(payload)) {
			resolveMessage(payload);
		}
	};

	// Subscribe before returning so the caller cannot miss a message
	await bus.subscribe(channel, onMessage);

	function done() {
		waiting = true;
		armIdleTimer();

		return withTimeout(messagePromise, timeout).finally(async () => {
			await cancel();
		});
	}

	async function cancel() {
		waiting = false;
		clearTimeout(idleTimer);

		await bus.unsubscribe(channel, onMessage).catch((error) => {
			useLogger().warn(error, `Could not release bus listener`);
		});
	}

	return {
		done,
		cancel,
	};
}

import { useBus } from '../bus/index.js';
import { useLogger } from '../logger/index.js';
import { withTimeout } from './with-timeout.js';

/**
 * Listens on a bus channel for the first "accepted" message.
 *
 * @param channel Bus channel to listen on.
 * @param options Wait options.
 * @param options.timeout How long `done` waits before giving up, in milliseconds. Defaults to 10 seconds.
 * @param options.accept Which message ends the wait. Defaults to the first received.
 * @returns `done` to wait for the message, `cancel` to stop listening without waiting.
 */
export async function waitForBusMessage<T, Accepted extends T = T>(
	channel: string,
	options?: {
		timeout?: number;
		accept?: (payload: T) => payload is Accepted;
	},
): Promise<{ done: () => Promise<Accepted>; cancel: () => Promise<void> }> {
	const bus = useBus();
	const logger = useLogger();
	const timeout = options?.timeout ?? 10_000;
	const accept = options?.accept;

	// TODO: Replace with Promise.withResolvers once supported
	let deliver: (payload: Accepted) => void;

	const onMessage = (payload: T) => {
		if (!accept || accept(payload)) deliver(payload as Accepted);
	};

	const message = new Promise<Accepted>((resolve) => (deliver = resolve));

	await bus.subscribe(channel, onMessage);

	/**
	 * Wait for the message or timeout
	 *
	 * @throws {Error} When the timeout expires before a message is accepted.
	 */
	function done() {
		const waiting = withTimeout(message, timeout, `Timed out after ${timeout}ms waiting for a message on "${channel}"`);

		return waiting.finally(cancel);
	}

	/** Manually release the listener */
	async function cancel() {
		await bus.unsubscribe(channel, onMessage).catch((e) => {
			logger.warn(e, `Could not release the bus listener for "${channel}"`);
		});
	}

	return { done, cancel };
}

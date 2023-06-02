import { setImmediate, setTimeout } from 'timers';
import { afterAll, beforeAll, afterEach, vi } from 'vitest';
import { setupServer } from 'msw/node';

export const URL = process.env.TEST_URL || 'http://localhost';
export const MODE = process.env.TEST_MODE || 'dryrun';

export const mockServer = setupServer();

// Start server before all tests
beforeAll(() => mockServer.listen({ onUnhandledRequest: 'error' }));

//  Close server after all tests
afterAll(() => mockServer.close());

// Reset handlers after each test `important for test isolation`
afterEach(() => mockServer.resetHandlers());

export async function timers(
	func: (opts: {
		flush: () => Promise<void>;
		sleep: (ms: number) => Promise<void>;
		tick: (ms: number) => Promise<void>;
		skip: (func: () => Promise<void>, date?: boolean) => Promise<any>;
	}) => Promise<void>,
	initial: number = Date.now()
): Promise<void> {
	const originals = {
		setTimeout: setTimeout,
		setImmediate: setImmediate,
	};

	vi.useFakeTimers();
	vi.setSystemTime(new Date(initial));

	let travel = 0;

	try {
		const tick = async (ms: number) => {
			travel += ms;
			await Promise.resolve().then(() => vi.advanceTimersByTime(ms));
		};

		const skip = async (func: () => Promise<void>, date = false) => {
			vi.useRealTimers();

			try {
				await func();
			} finally {
				if (date) {
					vi.setSystemTime(initial + travel);
				}

				vi.useFakeTimers();
			}
		};

		const flush = () =>
			new Promise<void>((resolve) => {
				vi.runAllTicks();

				originals.setImmediate(resolve);
			});

		const sleep = (ms: number) =>
			new Promise<void>((resolve) => {
				travel += ms;
				vi.advanceTimersByTime(travel);
				originals.setTimeout(resolve, ms);
			});

		await func({
			tick,
			skip,
			flush,
			sleep,
		});
	} finally {
		vi.clearAllTimers();
		vi.useRealTimers();
	}
}

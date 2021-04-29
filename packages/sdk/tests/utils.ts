import md from 'mockdate';
import nock, { back, BackMode } from 'nock';

export const URL = process.env.TEST_URL || 'http://localhost';
export const MODE = process.env.TEST_MODE || 'dryrun';

back.fixtures = `${__dirname}/fixtures`;
back.setMode(MODE as BackMode);

export type Test = (url: string, nock: () => nock.Scope) => Promise<void>;

export type TestSettings = {
	url?: string;
	fixture?: string;
};

export function test(name: string, test: Test, settings?: TestSettings): void {
	it(name, async () => {
		nock.cleanAll();

		const scope = () => nock(settings?.url || URL);
		if (settings?.fixture) {
			await back(settings.fixture, async () => {
				await test(settings?.url || URL, scope);
			});
		} else {
			await test(settings?.url || URL, scope);
		}

		nock.abortPendingRequests();
		nock.cleanAll();
	});
}

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
		setTimeout: global.setTimeout,
		setImmediate: global.setImmediate,
	};

	md.set(new Date(initial));

	let travel = 0;

	try {
		jest.useFakeTimers();
		const tick = async (ms: number) => {
			travel += ms;
			md.set(initial + travel);
			await Promise.resolve().then(() => jest.advanceTimersByTime(ms));
		};
		const skip = async (func: () => Promise<void>, date: boolean = false) => {
			if (date) {
				md.reset();
			}
			jest.useRealTimers();
			try {
				await func();
			} finally {
				if (date) {
					md.set(initial + travel);
				}
				jest.useFakeTimers();
			}
		};
		const flush = () => new Promise<void>((resolve) => originals.setImmediate(resolve));
		const sleep = (ms: number) =>
			new Promise<void>((resolve) => {
				travel += ms;
				md.set(initial + travel);
				originals.setTimeout(resolve, ms);
			});

		await func({
			tick,
			skip,
			flush,
			sleep,
		});
	} finally {
		md.reset();
		jest.clearAllTimers();
		jest.useRealTimers();
	}
}

import * as Nock from 'nock';
import { setImmediate, setTimeout, clearImmediate } from 'timers';
import argon2 from 'argon2';
import path from 'path';
import unfetch from 'unfetch';
import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';

export const URL = process.env.TEST_URL || 'http://localhost';
export const MODE = process.env.TEST_MODE || 'dryrun';

const nock = Nock.default;
const back = nock.back;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

back.fixtures = `${__dirname}/fixtures`;
back.setMode(MODE as Nock.BackMode);

export type Test = (url: string, nock: () => Nock.Scope) => Promise<void>;

export type TestSettings = {
	url?: string;
	fixture?: string;
};

export function test(name: string, test: Test, settings?: TestSettings): void {
	it(name, async () => {
		if (typeof window !== 'undefined') window.fetch = unfetch as any as typeof fetch;

		nock.cleanAll();

		const scope = () => nock(settings?.url || URL);
		if (settings?.fixture) {
			await back(settings.fixture, async () => {
				await test(settings?.url || URL, scope);
			});
		} else {
			await test(settings?.url || URL, scope);
		}

		// `clearImmediate` doesn't exist in the jsdom environment and nock throws ReferenceError
		if (typeof global.clearImmediate !== 'function') {
			global.clearImmediate = clearImmediate;
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
		setTimeout: setTimeout,
		setImmediate: setImmediate,
	};

	jest.useFakeTimers();
	jest.setSystemTime(new Date(initial));

	let travel = 0;

	try {
		const tick = async (ms: number) => {
			travel += ms;
			await Promise.resolve().then(() => jest.advanceTimersByTime(ms));
		};
		const skip = async (func: () => Promise<void>, date = false) => {
			jest.useRealTimers();
			try {
				await func();
			} finally {
				if (date) {
					jest.setSystemTime(initial + travel);
				}
				jest.useFakeTimers();
			}
		};
		const flush = () =>
			new Promise<void>((resolve) => {
				jest.runAllTicks();

				originals.setImmediate(resolve);
			});
		const sleep = (ms: number) =>
			new Promise<void>((resolve) => {
				travel += ms;
				jest.advanceTimersByTime(travel);
				originals.setTimeout(resolve, ms);
			});

		await func({
			tick,
			skip,
			flush,
			sleep,
		});
	} finally {
		jest.clearAllTimers();
		jest.useRealTimers();
	}
}

export function generateHash(stringToHash: string): Promise<string> {
	const buffer = 'string' as unknown as Buffer;
	const argon2HashConfigOptions = { test: 'test', associatedData: buffer }; // Disallow the HASH_RAW option, see https://github.com/directus/directus/discussions/7670#discussioncomment-1255805
	// test, if specified, must be passed as a Buffer to argon2.hash, see https://github.com/ranisalt/node-argon2/wiki/Options#test
	if ('test' in argon2HashConfigOptions)
		argon2HashConfigOptions.associatedData = Buffer.from(argon2HashConfigOptions.associatedData);
	return argon2.hash(stringToHash, argon2HashConfigOptions);
}

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

export function test(name: string, test: Test, settings?: TestSettings) {
	it(name, async () => {
		if (settings?.fixture) {
			await back(settings.fixture, async () => {
				await test(settings?.url || URL, () => nock(settings?.url || URL));
			});
		} else {
			await test(settings?.url || URL, () => nock(settings?.url || URL));
		}
	});
}

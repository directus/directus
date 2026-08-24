import { describe, expect, test, vi } from 'vitest';
import { getTriggers } from './triggers';

vi.mock('vue-i18n', () => ({
	useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock('../../../../utils/get-root-path', () => ({
	getPublicURL: () => 'http://localhost:8055/',
}));

describe('webhook trigger options', () => {
	const { triggers } = getTriggers();
	const webhook = triggers.find((t) => t.id === 'webhook')!;
	const getOptions = webhook.options as (opts: Record<string, any>) => Record<string, any>[];

	test('cacheQueryParams field should be visible when cacheEnabled is true (default)', () => {
		const options = getOptions({ method: 'GET', cacheEnabled: true });
		const cacheQueryParams = options.find((o) => o['field'] === 'cacheQueryParams');

		expect(cacheQueryParams).toBeDefined();
		expect(cacheQueryParams!['meta']['hidden']).toBe(false);
	});

	test('cacheQueryParams field should be visible when cacheEnabled is undefined (default)', () => {
		const options = getOptions({ method: 'GET', cacheEnabled: undefined });
		const cacheQueryParams = options.find((o) => o['field'] === 'cacheQueryParams');

		expect(cacheQueryParams).toBeDefined();
		expect(cacheQueryParams!['meta']['hidden']).toBe(false);
	});

	test('cacheQueryParams field should be hidden when cacheEnabled is false', () => {
		const options = getOptions({ method: 'GET', cacheEnabled: false });
		const cacheQueryParams = options.find((o) => o['field'] === 'cacheQueryParams');

		expect(cacheQueryParams).toBeDefined();
		expect(cacheQueryParams!['meta']['hidden']).toBe(true);
	});

	test('cacheQueryParams field should be hidden for non-GET methods', () => {
		const options = getOptions({ method: 'POST', cacheEnabled: true });
		const cacheQueryParams = options.find((o) => o['field'] === 'cacheQueryParams');

		expect(cacheQueryParams).toBeDefined();
		expect(cacheQueryParams!['meta']['hidden']).toBe(true);
	});
});

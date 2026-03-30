import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/api';

const mockGetCollection = vi.fn();

vi.mock('@/stores/collections', () => ({
	useCollectionsStore: () => ({ getCollection: mockGetCollection }),
}));

vi.mock('@/api', () => ({ default: { get: vi.fn() } }));

const { stripOrphanedVersionId, stripVersionOnNonVersioned, stripVersionIdOnRealItem, validateItemlessDraft } =
	await import('./index');

function makeRoute(overrides: {
	collection?: string | string[];
	primaryKey?: string;
	query?: Record<string, string>;
	fullPath?: string;
}): any {
	const { collection = 'posts', primaryKey = '3', query = {}, fullPath } = overrides;
	const params: Record<string, string | string[]> = { collection };
	if (primaryKey !== undefined) params['primaryKey'] = primaryKey;

	const computedFullPath =
		fullPath ??
		`/content/${typeof collection === 'string' ? collection : collection[0]}/${primaryKey}` +
			(Object.keys(query).length ? '?' + new URLSearchParams(query).toString() : '');

	return { params, query, fullPath: computedFullPath };
}

describe('stripOrphanedVersionId', () => {
	it('strips versionId when version is absent', () => {
		const to = makeRoute({ query: { versionId: 'abc' }, fullPath: '/content/posts/3?versionId=abc' });
		expect(stripOrphanedVersionId(to, {} as any, vi.fn())).toBe('/content/posts/3');
	});

	it('passes through when both version and versionId are present', () => {
		const to = makeRoute({
			query: { version: 'draft', versionId: 'abc' },
			fullPath: '/content/posts/+?version=draft&versionId=abc',
		});

		expect(stripOrphanedVersionId(to, {} as any, vi.fn())).toBeUndefined();
	});

	it('passes through when neither param is present', () => {
		const to = makeRoute({ query: {}, fullPath: '/content/posts/3' });
		expect(stripOrphanedVersionId(to, {} as any, vi.fn())).toBeUndefined();
	});

	it('strips versionId when it is an empty string', () => {
		const to = makeRoute({ query: { versionId: '' }, fullPath: '/content/posts/3?versionId=' });
		expect(stripOrphanedVersionId(to, {} as any, vi.fn())).toBe('/content/posts/3');
	});
});

describe('stripVersionOnNonVersioned', () => {
	beforeEach(() => mockGetCollection.mockReset());

	it('strips version and versionId when collection has versioning disabled', () => {
		mockGetCollection.mockReturnValue({ meta: { versioning: false } });

		const to = makeRoute({
			query: { version: 'draft', versionId: 'abc' },
			fullPath: '/content/posts/3?version=draft&versionId=abc',
		});

		expect(stripVersionOnNonVersioned(to, {} as any, vi.fn())).toBe('/content/posts/3');
	});

	it('passes through when collection has versioning enabled', () => {
		mockGetCollection.mockReturnValue({ meta: { versioning: true } });
		const to = makeRoute({ query: { version: 'draft' }, fullPath: '/content/posts/3?version=draft' });
		expect(stripVersionOnNonVersioned(to, {} as any, vi.fn())).toBeUndefined();
	});

	it('passes through when collection is not found in store', () => {
		mockGetCollection.mockReturnValue(null);
		const to = makeRoute({ query: { version: 'draft' }, fullPath: '/content/posts/3?version=draft' });
		expect(stripVersionOnNonVersioned(to, {} as any, vi.fn())).toBeUndefined();
	});

	it('passes through when collection param is an array (non-string)', () => {
		const to = makeRoute({ collection: ['posts', 'other'], query: { version: 'draft' } });
		expect(stripVersionOnNonVersioned(to, {} as any, vi.fn())).toBeUndefined();
	});

	it('passes through when no version params present even on non-versioned collection', () => {
		mockGetCollection.mockReturnValue({ meta: { versioning: false } });
		const to = makeRoute({ query: {}, fullPath: '/content/posts/3' });
		expect(stripVersionOnNonVersioned(to, {} as any, vi.fn())).toBeUndefined();
	});

	it('preserves bookmark when stripping version params', () => {
		mockGetCollection.mockReturnValue({ meta: { versioning: false } });

		const to = makeRoute({
			query: { version: 'draft', bookmark: 'my-bookmark' },
			fullPath: '/content/posts/3?version=draft&bookmark=my-bookmark',
		});

		expect(stripVersionOnNonVersioned(to, {} as any, vi.fn())).toBe('/content/posts/3?bookmark=my-bookmark');
	});
});

describe('stripVersionIdOnRealItem', () => {
	it('strips versionId when primaryKey is a real item', () => {
		const to = makeRoute({
			primaryKey: '3',
			query: { version: 'draft', versionId: 'abc' },
			fullPath: '/content/posts/3?version=draft&versionId=abc',
		});

		expect(stripVersionIdOnRealItem(to, {} as any, vi.fn())).toBe('/content/posts/3?version=draft');
	});

	it('passes through when primaryKey is "+" (item-less draft)', () => {
		const to = makeRoute({
			primaryKey: '+',
			query: { version: 'draft', versionId: 'abc' },
			fullPath: '/content/posts/+?version=draft&versionId=abc',
		});

		expect(stripVersionIdOnRealItem(to, {} as any, vi.fn())).toBeUndefined();
	});

	it('passes through when versionId is absent', () => {
		const to = makeRoute({
			primaryKey: '3',
			query: { version: 'draft' },
			fullPath: '/content/posts/3?version=draft',
		});

		expect(stripVersionIdOnRealItem(to, {} as any, vi.fn())).toBeUndefined();
	});

	it('preserves bookmark when stripping versionId', () => {
		const to = makeRoute({
			primaryKey: '3',
			query: { version: 'draft', versionId: 'abc', bookmark: 'my-bookmark' },
			fullPath: '/content/posts/3?version=draft&versionId=abc&bookmark=my-bookmark',
		});

		expect(stripVersionIdOnRealItem(to, {} as any, vi.fn())).toBe(
			'/content/posts/3?version=draft&bookmark=my-bookmark',
		);
	});
});

describe('validateItemlessDraft', () => {
	beforeEach(() => vi.mocked(api.get).mockReset());

	it('passes through when primaryKey is not "+"', async () => {
		const to = makeRoute({
			primaryKey: '3',
			query: { version: 'draft', versionId: 'abc' },
			fullPath: '/content/posts/3?version=draft&versionId=abc',
		});

		const result = await validateItemlessDraft(to, {} as any, vi.fn());
		expect(result).toBeUndefined();
		expect(api.get).not.toHaveBeenCalled();
	});

	it('passes through when version is absent', async () => {
		const to = makeRoute({
			primaryKey: '+',
			query: { versionId: 'abc' },
			fullPath: '/content/posts/+?versionId=abc',
		});

		const result = await validateItemlessDraft(to, {} as any, vi.fn());
		expect(result).toBeUndefined();
		expect(api.get).not.toHaveBeenCalled();
	});

	it('passes through when versionId is absent', async () => {
		const to = makeRoute({
			primaryKey: '+',
			query: { version: 'draft' },
			fullPath: '/content/posts/+?version=draft',
		});

		const result = await validateItemlessDraft(to, {} as any, vi.fn());
		expect(result).toBeUndefined();
		expect(api.get).not.toHaveBeenCalled();
	});

	it('falls through on API error', async () => {
		vi.mocked(api.get).mockRejectedValueOnce(new Error('network error'));

		const to = makeRoute({
			primaryKey: '+',
			query: { version: 'draft', versionId: 'abc' },
			fullPath: '/content/posts/+?version=draft&versionId=abc',
		});

		expect(await validateItemlessDraft(to, {} as any, vi.fn())).toBeUndefined();
	});

	it('redirects to real item when version was promoted (string PK)', async () => {
		vi.mocked(api.get).mockResolvedValueOnce({ data: { data: { item: '42', key: 'draft' } } });

		const to = makeRoute({
			collection: 'posts',
			primaryKey: '+',
			query: { version: 'draft', versionId: 'abc' },
			fullPath: '/content/posts/+?version=draft&versionId=abc',
		});

		expect(await validateItemlessDraft(to, {} as any, vi.fn())).toBe('/content/posts/42?version=draft');
	});

	it('redirects to real item when version was promoted (numeric PK)', async () => {
		vi.mocked(api.get).mockResolvedValueOnce({ data: { data: { item: 42, key: 'draft' } } });

		const to = makeRoute({
			collection: 'posts',
			primaryKey: '+',
			query: { version: 'draft', versionId: 'abc' },
			fullPath: '/content/posts/+?version=draft&versionId=abc',
		});

		expect(await validateItemlessDraft(to, {} as any, vi.fn())).toBe('/content/posts/42?version=draft');
	});

	it('corrects stale version key', async () => {
		vi.mocked(api.get).mockResolvedValueOnce({ data: { data: { item: null, key: 'v2' } } });

		const to = makeRoute({
			collection: 'posts',
			primaryKey: '+',
			query: { version: 'v1', versionId: 'abc' },
			fullPath: '/content/posts/+?version=v1&versionId=abc',
		});

		expect(await validateItemlessDraft(to, {} as any, vi.fn())).toBe('/content/posts/+?version=v2&versionId=abc');
	});

	it('proceeds when version key matches fetched key (valid URL)', async () => {
		vi.mocked(api.get).mockResolvedValueOnce({ data: { data: { item: null, key: 'draft' } } });

		const to = makeRoute({
			primaryKey: '+',
			query: { version: 'draft', versionId: 'abc' },
			fullPath: '/content/posts/+?version=draft&versionId=abc',
		});

		expect(await validateItemlessDraft(to, {} as any, vi.fn())).toBeUndefined();
	});
});

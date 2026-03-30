import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetCollection = vi.fn();

vi.mock('@/stores/collections', () => ({
	useCollectionsStore: () => ({ getCollection: mockGetCollection }),
}));

const { enterDraftContext } = await import('./index');

function makeRoute(overrides: {
	collection?: string | string[];
	primaryKey?: string;
	query?: Record<string, string>;
}): any {
	const { collection = 'posts', primaryKey = '+', query = {} } = overrides;
	const params: Record<string, string | string[]> = { collection };
	if (primaryKey !== undefined) params['primaryKey'] = primaryKey;
	return { params, query };
}

describe('enterDraftContext', () => {
	beforeEach(() => mockGetCollection.mockReset());

	it('redirects to draft context when primaryKey is "+" on versioned collection', () => {
		mockGetCollection.mockReturnValue({ meta: { versioning: true } });

		const to = makeRoute({ query: {} });
		const result = enterDraftContext(to, {} as any, vi.fn());

		expect(result).toEqual({
			...to,
			query: { version: 'draft' },
		});
	});

	it('passes through when already in version context', () => {
		mockGetCollection.mockReturnValue({ meta: { versioning: true } });

		const to = makeRoute({ query: { version: 'draft' } });
		expect(enterDraftContext(to, {} as any, vi.fn())).toBeUndefined();
	});

	it('passes through when primaryKey is not "+"', () => {
		mockGetCollection.mockReturnValue({ meta: { versioning: true } });

		const to = makeRoute({ primaryKey: '3', query: {} });
		expect(enterDraftContext(to, {} as any, vi.fn())).toBeUndefined();
	});

	it('passes through when collection has versioning disabled', () => {
		mockGetCollection.mockReturnValue({ meta: { versioning: false } });

		const to = makeRoute({ query: {} });
		expect(enterDraftContext(to, {} as any, vi.fn())).toBeUndefined();
	});

	it('passes through when collection is not found in store', () => {
		mockGetCollection.mockReturnValue(null);

		const to = makeRoute({ query: {} });
		expect(enterDraftContext(to, {} as any, vi.fn())).toBeUndefined();
	});

	it('passes through when collection param is an array', () => {
		const to = makeRoute({ collection: ['posts', 'other'], query: {} });
		expect(enterDraftContext(to, {} as any, vi.fn())).toBeUndefined();
	});

	it('preserves existing query params when adding version', () => {
		mockGetCollection.mockReturnValue({ meta: { versioning: true } });

		const to = makeRoute({ query: { bookmark: 'my-bookmark' } });
		const result = enterDraftContext(to, {} as any, vi.fn());

		expect(result).toEqual({
			...to,
			query: { bookmark: 'my-bookmark', version: 'draft' },
		});
	});
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useVersionQuery } from './use-version-query';

const mockUseRouteQuery = vi.fn(() => ref(null));

vi.mock('@vueuse/router', () => ({
	useRouteQuery: (...args: any[]) => mockUseRouteQuery(...args),
}));

afterEach(() => {
	vi.clearAllMocks();
});

describe('useVersionQuery', () => {
	it('calls useRouteQuery with version key and null default', () => {
		useVersionQuery();

		expect(mockUseRouteQuery).toHaveBeenCalledWith(
			'version',
			null,
			expect.objectContaining({ transform: expect.any(Function) }),
		);
	});

	it('returns the ref from useRouteQuery', () => {
		const versionRef = ref('draft');
		mockUseRouteQuery.mockReturnValueOnce(versionRef);

		const result = useVersionQuery();

		expect(result).toBe(versionRef);
	});

	describe('transform', () => {
		function getTransform() {
			useVersionQuery();
			const [, , options] = mockUseRouteQuery.mock.calls[0]!;
			return options.transform as (value: string | string[]) => string | null;
		}

		it('returns scalar string as-is', () => {
			expect(getTransform()('draft')).toBe('draft');
		});

		it('returns first element of array', () => {
			expect(getTransform()(['draft', 'other'])).toBe('draft');
		});
	});
});

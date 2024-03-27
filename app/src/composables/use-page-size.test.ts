import { describe, expect, test, vi } from 'vitest';
import { useServerStore } from '@/stores/server';
import { usePageSize } from './use-page-size';

vi.mock('@/stores/server', () => {
	return {
		useServerStore: vi.fn(),
	};
});

const AVAILABLE_SIZES = [10, 25, 50, 100, 250, 500, 1000, 10000];

describe('usePageSize', () => {
	test('no query limit', () => {
		vi.mocked(useServerStore).mockReturnValue({
			info: {
				queryLimit: undefined,
			},
		} as any);

		const fallbackSize = 25;
		const { sizes, selected } = usePageSize<number>(AVAILABLE_SIZES, (x) => x, fallbackSize);
		expect(sizes.value).toStrictEqual(AVAILABLE_SIZES);
		expect(selected).toBe(fallbackSize);
	});

	test('map sizes to string', () => {
		vi.mocked(useServerStore).mockReturnValue({
			info: {
				queryLimit: undefined,
			},
		} as any);

		const fallbackSize = 25;
		const { sizes, selected } = usePageSize<string>(AVAILABLE_SIZES, (x) => String(x), fallbackSize);
		expect(sizes.value).toStrictEqual(['10', '25', '50', '100', '250', '500', '1000', '10000']);
		expect(selected).toBe(fallbackSize);
	});

	test('max queryLimit -1', () => {
		vi.mocked(useServerStore).mockReturnValue({
			info: {
				queryLimit: {
					max: -1,
					default: -1,
				},
			},
		} as any);

		const fallbackSize = 25;
		const { sizes, selected } = usePageSize<number>(AVAILABLE_SIZES, (x) => x, fallbackSize);
		expect(sizes.value).toStrictEqual(AVAILABLE_SIZES);
		expect(selected).toBe(fallbackSize);
	});

	test('max queryLimit 100', () => {
		vi.mocked(useServerStore).mockReturnValue({
			info: {
				queryLimit: {
					max: 100,
					default: 100,
				},
			},
		} as any);

		const fallbackSize = 25;
		const { sizes, selected } = usePageSize<number>(AVAILABLE_SIZES, (x) => x, fallbackSize);
		expect(sizes.value).toStrictEqual([10, 25, 50, 100]);
		expect(selected).toBe(fallbackSize);
	});

	test('max queryLimit 99', () => {
		vi.mocked(useServerStore).mockReturnValue({
			info: {
				queryLimit: {
					max: 99,
					default: 100,
				},
			},
		} as any);

		const fallbackSize = 25;
		const { sizes, selected } = usePageSize<number>(AVAILABLE_SIZES, (x) => x, fallbackSize);
		expect(sizes.value).toStrictEqual([10, 25, 50]);
		expect(selected).toBe(fallbackSize);
	});

	test('max queryLimit 9', () => {
		vi.mocked(useServerStore).mockReturnValue({
			info: {
				queryLimit: {
					max: 9,
					default: 100,
				},
			},
		} as any);

		const fallbackSize = 25;
		const { sizes, selected } = usePageSize<number>(AVAILABLE_SIZES, (x) => x, fallbackSize);
		expect(sizes.value).toStrictEqual([9]);
		expect(selected).toBe(9);
	});
});

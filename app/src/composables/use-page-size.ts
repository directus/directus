import { useServerStore } from '@/stores/server';
import { ComputedRef, computed } from 'vue';

export function usePageSize<T = any>(
	availableSizes: number[],
	mapCallback: (value: number, index: number, array: number[]) => T,
	fallbackSize = 25
): { sizes: ComputedRef<T[]>; selected: number } {
	const {
		info: { queryLimit },
	} = useServerStore();

	const pageSizes = computed<T[]>(() => {
		if (queryLimit === undefined) return availableSizes.map(mapCallback);

		const sizes = availableSizes.filter((size) => size <= queryLimit.max);

		if (sizes.length === 0) {
			sizes.push(queryLimit.max);
		}

		return sizes.map(mapCallback);
	});

	const initialSize =
		queryLimit === undefined ? fallbackSize : Math.min(queryLimit.default ?? Infinity, queryLimit.max);

	return {
		sizes: pageSizes,
		selected: initialSize,
	};
}

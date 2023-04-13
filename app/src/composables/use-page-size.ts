import { useServerStore } from '@/stores/server';
import { ComputedRef, computed } from 'vue';

export function usePageSize<T = any>(
	availableSizes: number[],
	mapCallback: (value: number, index: number, array: number[]) => T,
	fallbackSize = 25
): { sizes: ComputedRef<T[]>; selected: number } {
	const { info } = useServerStore();

	const pageSizes = computed<T[]>(() => {
		if (info.queryLimit === undefined) return availableSizes.map(mapCallback);

		const sizes = availableSizes.filter((size) => size <= info.queryLimit!.max);
		if (sizes.length === 0) {
			sizes.push(info.queryLimit!.max);
		}

		return sizes.map(mapCallback);
	});

	const initialSize =
		info.queryLimit === undefined ? fallbackSize : Math.min(info.queryLimit!.default ?? Infinity, info.queryLimit!.max);

	return {
		sizes: pageSizes,
		selected: initialSize,
	};
}

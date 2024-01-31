import type { Ref } from 'vue';
import { computed } from 'vue';

export function useSync<T, K extends keyof T & string, E extends (event: `update:${K}`, ...args: any[]) => void>(
	props: T,
	key: K,
	emit: E,
): Ref<T[K]> {
	return computed<T[K]>({
		get() {
			return props[key];
		},
		set(newVal) {
			emit(`update:${key}` as const, newVal);
		},
	});
}

import { computed, Ref } from '@vue/composition-api';

export default function useSync<T, K extends keyof T>(
	props: T,
	key: K,
	emit: (event: string, ...args: any[]) => void
): Ref<T[K]> {
	return computed<T[K]>({
		get() {
			return props[key];
		},
		set(newVal) {
			emit(`update:${key}`, newVal);
		},
	});
}

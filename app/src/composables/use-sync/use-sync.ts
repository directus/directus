import { computed, Ref } from '@vue/composition-api';
import { clone } from 'lodash';

export default function useSync<T, K extends keyof T>(
	props: T,
	key: K,

	emit: (event: string, ...args: any[]) => void
): Ref<Readonly<T[K]>> {
	return computed<T[K]>({
		get() {
			return clone(props[key]);
		},
		set(newVal) {
			emit(`update:${key}`, newVal);
		},
	});
}

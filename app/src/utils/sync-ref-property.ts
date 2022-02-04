import { isFunction } from 'lodash';
import { computed, Ref } from 'vue';

export function syncRefProperty<R, T extends keyof R>(ref: Ref<R>, key: T, defaultValue: R[T] | (() => R[T])) {
	return computed<R[T]>({
		get: () => {
			return ref.value?.[key] ?? (isFunction(defaultValue) ? defaultValue() : defaultValue);
		},
		set: (value: R[T]) => {
			ref.value = Object.assign({}, ref.value, { [key]: value }) as R;
		},
	});
}

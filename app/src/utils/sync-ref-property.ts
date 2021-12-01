import { computed, Ref, unref } from 'vue';

export function syncRefProperty<R, T extends keyof R>(ref: Ref<R>, key: T, defaultValue: R[T] | Ref<R[T]>) {
	return computed<R[T]>({
		get() {
			return ref.value?.[key] ?? unref(defaultValue);
		},
		set(value: R[T]) {
			ref.value = Object.assign({}, ref.value, { [key]: value }) as R;
		},
	});
}

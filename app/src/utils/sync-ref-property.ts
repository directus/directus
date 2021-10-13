import { computed, Ref } from 'vue';

export function syncRefProperty<R, T extends keyof R>(ref: Ref<R>, key: T, defaultValue: R[T]) {
	return computed<R[T]>({
		get: () => ref.value?.[key] ?? defaultValue,
		set: (value: R[T]) => {
			ref.value = Object.assign({}, ref.value, { [key]: value }) as R;
		},
	});
}

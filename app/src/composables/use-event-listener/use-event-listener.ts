import { onMounted, onBeforeUnmount, Ref, isRef } from '@vue/composition-api';

export default function useEventListener<T extends EventTarget, E extends Event>(
	target: T | Ref<T>,
	type: string,
	handler: (this: T, evt: E) => void,
	options?: AddEventListenerOptions
): void {
	onMounted(() => {
		const t = isRef(target) ? target.value : target;
		t.addEventListener(type, handler as (evt: Event) => void, options);
	});

	onBeforeUnmount(() => {
		const t = isRef(target) ? target.value : target;
		t.removeEventListener(type, handler as (evt: Event) => void, options);
	});
}

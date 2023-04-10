import { onMounted, onBeforeUnmount, Ref, unref } from 'vue';

/**
 * Adds the given event listener to the given element on mount. Auto-cleans up the event listener on
 * unmount.
 *
 * @param target - The element to add the event listener to.
 * @param type - The event type to listen for.
 * @param handler - The event listener handler function to add.
 * @param options - The event listener options.
 */
export function useEventListener<T extends EventTarget, E extends Event>(
	target: T | Ref<T>,
	type: string,
	handler: (this: T, evt: E) => void,
	options?: AddEventListenerOptions
): void {
	onMounted(() => {
		unref(target).addEventListener(type, handler as (evt: Event) => void, options);
	});

	onBeforeUnmount(() => {
		unref(target).removeEventListener(type, handler as (evt: Event) => void, options);
	});
}

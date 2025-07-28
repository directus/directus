import { isNil } from 'lodash-es';
import type { Ref } from 'vue';
import { isRef, onMounted, onUnmounted, ref } from 'vue';

declare global {
	interface Window {
		ResizeObserver: any;
	}
}

/**
 * A Vue composable that reactively tracks the size of a DOM element using ResizeObserver.
 *
 * @template T - The type of the element being observed, must extend Element
 * @param target - The element to observe. Can be:
 *   - A direct element reference
 *   - A Vue ref containing an element
 *   - A Vue ref that might be undefined
 *
 * @returns An object containing reactive width and height values:
 *   - width: Ref<number> - The current width of the element in pixels
 *   - height: Ref<number> - The current height of the element in pixels
 *
 * @example
 * ```typescript
 * // With a template ref
 * const elementRef = ref<HTMLDivElement>();
 * const { width, height } = useElementSize(elementRef);
 *
 * // With a direct element
 * const element = document.getElementById('my-element');
 * const { width, height } = useElementSize(element);
 * ```
 *
 * @remarks
 * - The composable automatically sets up a ResizeObserver when the component mounts
 * - The observer is automatically disconnected when the component unmounts
 * - Initial values are 0 until the first resize event
 * - Handles cases where the target element might be undefined
 */
export function useElementSize<T extends Element>(
	target: T | Ref<T> | Ref<undefined>,
): {
	width: Ref<number>;
	height: Ref<number>;
} {
	const width = ref(0);
	const height = ref(0);

	const resizeObserver = new ResizeObserver(([entry]) => {
		if (entry === undefined) return;
		width.value = entry.contentRect.width;
		height.value = entry.contentRect.height;
	});

	onMounted(() => {
		const t = isRef(target) ? target.value : target;

		if (!isNil(t)) {
			resizeObserver.observe(t);
		}
	});

	onUnmounted(() => {
		resizeObserver.disconnect();
	});

	return { width, height };
}

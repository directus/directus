import { isNil } from 'lodash-es';
import type { Ref } from 'vue';
import { isRef, onMounted, onUnmounted, ref } from 'vue';

declare global {
	interface Window {
		ResizeObserver: any;
	}
}

export function useElementSize<T extends Element>(
	target: T | Ref<T> | Ref<undefined>
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

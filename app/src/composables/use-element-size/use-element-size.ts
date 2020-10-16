import { Ref, ref, isRef, onMounted, onUnmounted } from '@vue/composition-api';
import { notEmpty } from '@/utils/is-empty';
import { ResizeObserver as ResizeObserverPolyfill } from 'resize-observer';
import Vue from 'vue';

declare global {
	interface Window {
		ResizeObserver: any;
	}
}

export default function useElementSize<T extends Element>(target: T | Ref<undefined | null | T | Vue>) {
	const width = ref(0);
	const height = ref(0);

	let RO = ResizeObserverPolyfill;

	if ('ResizeObserver' in window) {
		RO = window.ResizeObserver;
	}

	const resizeObserver = new RO(([entry]) => {
		width.value = entry.contentRect.width;
		height.value = entry.contentRect.height;
	});

	onMounted(() => {
		const deref = isRef(target) ? target.value : target;
		console.log(deref);

		let targetElement: Element;

		if (deref instanceof Vue) {
			targetElement = (deref as Vue).$el;
		} else {
			targetElement = deref as Element;
		}

		if (notEmpty(targetElement)) {
			resizeObserver.observe(targetElement);
		}
	});

	onUnmounted(() => {
		resizeObserver.disconnect();
	});

	return { width, height };
}

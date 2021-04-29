import { ref, onMounted, onUnmounted, Ref, isRef, computed } from '@vue/composition-api';
import { throttle } from 'lodash';

export default function useScrollDistance<T extends Element>(t: T | Ref<T | null | Vue>): Record<string, Ref> {
	const top = ref<number>();
	const left = ref<number>();

	const onScroll = throttle((event: Event) => {
		const target = event.target as Element;
		top.value = target.scrollTop;
		left.value = target.scrollLeft;
	}, 20);

	const target = computed<Element | null>(() => {
		const target = isRef(t) ? t.value : t;

		if (target === null) {
			return null;
		}

		if (target.hasOwnProperty('$el')) {
			return (target as Vue).$el as Element;
		}

		return target as Element;
	});

	onMounted(() => {
		target.value?.addEventListener('scroll', onScroll, { passive: true });
	});

	onUnmounted(() => {
		target.value?.removeEventListener('scroll', onScroll);
	});

	return { top, left, target };
}

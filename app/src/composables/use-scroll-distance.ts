import { throttle } from 'lodash';
import { ComponentPublicInstance, computed, isRef, onMounted, onUnmounted, ref, Ref, ComputedRef } from 'vue';

type UsableScrollDistance = {
	top: Ref<number | undefined>;
	left: Ref<number | undefined>;
	target: ComputedRef<Element | null>;
};

export default function useScrollDistance<T extends Element>(
	t: T | Ref<T | null | ComponentPublicInstance>
): UsableScrollDistance {
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

		if ('$el' in target) {
			return (target as ComponentPublicInstance).$el as Element;
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

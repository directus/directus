import { useEventListener } from '@vueuse/core';
import { onMounted, type Ref } from 'vue';
import { useRoute } from 'vue-router';

// Every route change mounts a new private view, so the offsets have to outlive the component
const offsets = new Map<string, number>();

/**
 * Retains the module navigation's scroll offset across route changes. Offsets are tracked per
 * module, so switching modules doesn't restore an unrelated navigation's position.
 *
 * @param element - The scroll container of the module navigation.
 */
export function useNavScroll(element: Ref<HTMLElement | null>) {
	const route = useRoute();

	const getModule = () => route.path.split('/')[1] ?? '';

	useEventListener(element, 'scroll', () => offsets.set(getModule(), element.value!.scrollTop), { passive: true });

	onMounted(() => {
		const offset = offsets.get(getModule());
		if (offset && element.value) element.value.scrollTop = offset;
	});
}

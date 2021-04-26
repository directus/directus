import { onMounted, onUnmounted, ref, onBeforeMount, Ref } from '@vue/composition-api';
import { throttle } from 'lodash';

type WindowSizeOptions = {
	throttle: number;
};

export default function useWindowSize(options: WindowSizeOptions = { throttle: 100 }): Record<string, Ref> {
	const width = ref(0);
	const height = ref(0);

	function setSize() {
		width.value = window.innerWidth;
		height.value = window.innerHeight;
	}

	const onResize = throttle(setSize, options.throttle);

	onBeforeMount(setSize);

	onMounted(() => {
		window.addEventListener('resize', onResize, { passive: true });
	});

	onUnmounted(() => {
		window.removeEventListener('resize', onResize);
	});

	return { width, height };
}

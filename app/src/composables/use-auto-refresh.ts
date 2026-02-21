import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { emitter, Events } from '@/events';

export function useAutoRefresh(refreshInterval, refresh) {
	const active = computed(() => refreshInterval.value && refreshInterval.value > 0);

	const interval = ref<NodeJS.Timeout>();

	const setRefreshInterval = (value: number | null) => {
		clearInterval(interval.value);

		if (!value || value <= 0) return;

		interval.value = setInterval(() => {
			refresh();
		}, value * 1000);
	};

	const onIdle = () => clearInterval(interval.value);

	const onActive = () => {
		if (active.value) refresh();
		setRefreshInterval(refreshInterval.value);
	};

	onMounted(() => {
		setRefreshInterval(refreshInterval.value);
	});

	emitter.on(Events.tabIdle, onIdle);
	emitter.on(Events.tabActive, onActive);

	onUnmounted(() => {
		emitter.off(Events.tabIdle, onIdle);
		emitter.off(Events.tabActive, onActive);
	});

	watch(
		refreshInterval,
		() => {
			refresh();

			if (refreshInterval.value) {
				setRefreshInterval(refreshInterval.value);
			} else {
				clearInterval(interval.value);
			}
		},
		{ immediate: true },
	);
}

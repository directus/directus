import { localizedFormatDistance } from '@/utils/localized-format-distance';
import { onMounted, onUnmounted, Ref, ref } from 'vue';

export function useTimeFromNow(date: Date | number, autoUpdate = 60000): Ref<string> {
	let interval: number;

	const formatOptions = {
		addSuffix: true,
	};

	const formattedDate = ref(localizedFormatDistance(date, new Date(), formatOptions));

	if (autoUpdate !== 0) {
		onMounted(() => {
			interval = window.setInterval(() => {
				formattedDate.value = localizedFormatDistance(date, new Date(), formatOptions);
			}, autoUpdate);
		});

		onUnmounted(() => {
			clearInterval(interval);
		});
	}

	return formattedDate;
}

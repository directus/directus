import { onMounted, onUnmounted, ref } from '@vue/composition-api';
import localizedFormatDistance from '@/utils/localized-format-distance/';

export async function useTimeFromNow(date: Date | number, autoUpdate = 60000) {
	let interval: number;

	const formatOptions = {
		addSuffix: true,
	};

	const formattedDate = ref(await localizedFormatDistance(date, new Date(), formatOptions));

	if (autoUpdate !== 0) {
		onMounted(() => {
			interval = window.setInterval(async () => {
				formattedDate.value = await localizedFormatDistance(date, new Date(), formatOptions);
			}, autoUpdate);
		});

		onUnmounted(() => {
			clearInterval(interval);
		});
	}

	return formattedDate;
}

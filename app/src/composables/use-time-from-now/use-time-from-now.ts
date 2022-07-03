import localizedFormatDistance from '@/utils/localized-format-distance/';
import { onMounted, onUnmounted, Ref, ref } from 'vue';

export async function useTimeFromNow(date: Date | number, autoUpdate = 60000): Promise<Ref<string>> {
	let interval: number;

	const formatOptions = {
		addSuffix: true,
	};

	const formattedDate = ref(localizedFormatDistance(date, new Date(), formatOptions));

	if (autoUpdate !== 0) {
		onMounted(() => {
			interval = window.setInterval(async () => {
				formattedDate.value = localizedFormatDistance(date, new Date(), formatOptions);
			}, autoUpdate);
		});

		onUnmounted(() => {
			clearInterval(interval);
		});
	}

	return formattedDate;
}

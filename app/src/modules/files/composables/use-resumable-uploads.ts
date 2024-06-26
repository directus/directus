import { emitter, Events } from '@/events';
import { useServerStore } from '@/stores/server';
import { useApi } from '@directus/composables';
import * as tus from 'tus-js-client';
import { onMounted, onUnmounted, ref } from 'vue';

export type PreviousUpload = tus.PreviousUpload & {
	uploadUrl: string;
};

export function useResumableUploads() {
	const server = useServerStore();
	const uploads = ref<PreviousUpload[]>([]);

	if (!server.info.uploads) {
		return uploads;
	}

	const api = useApi();

	onMounted(() => emitter.on(Events.tusResumableUploadsChanged, refresh));
	onUnmounted(() => emitter.off(Events.tusResumableUploadsChanged, refresh));

	refresh();

	return uploads;

	async function refresh() {
		const { urlStorage } = tus.defaultOptions;
		const infos = (await urlStorage.findAllUploads()) as PreviousUpload[];

		const serverAvailability = (
			await Promise.allSettled(
				infos.map(({ uploadUrl }) =>
					uploadUrl
						? api.head(uploadUrl, {
								headers: {
									'Tus-Resumable': '1.0.0',
								},
						  })
						: Promise.resolve(null),
				),
			)
		).map((result) => result.status === 'fulfilled');

		uploads.value = [];

		serverAvailability.forEach((available, index) => {
			if (available) {
				uploads.value.push(infos[index]);
			} else {
				// Clean up after TUS (this helps this function keep the requests to a minimum on the next call)
				urlStorage.removeUpload(infos[index].urlStorageKey);
			}
		});
	}
}

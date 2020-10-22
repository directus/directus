import api from '@/api';
import { useNotificationsStore } from '@/stores';
import i18n from '@/lang';

import emitter, { Events } from '@/events';

export default async function uploadFile(
	file: File,
	options?: {
		onProgressChange?: (percentage: number) => void;
		notifications?: boolean;
		preset?: Record<string, any>;
	}
) {
	const notify = useNotificationsStore();
	const progressHandler = options?.onProgressChange || (() => undefined);
	const formData = new FormData();

	if (options?.preset) {
		for (const [key, value] of Object.entries(options.preset)) {
			formData.append(key, value);
		}
	}

	formData.append('file', file);

	try {
		const response = await api.post(`/files`, formData, {
			onUploadProgress,
		});

		if (options?.notifications) {
			notify.add({
				title: i18n.t('upload_file_success'),
				type: 'success',
			});
		}

		emitter.emit(Events.upload);

		return response.data.data;
	} catch (error) {
		if (options?.notifications) {
			notify.add({
				title: i18n.t('upload_file_failed'),
				type: 'error',
				dialog: true,
				error,
			});
		}
	}

	function onUploadProgress(progressEvent: { loaded: number; total: number }) {
		const percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
		progressHandler(percentCompleted);
	}
}

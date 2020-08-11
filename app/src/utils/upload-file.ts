import api from '@/api';

import { notify } from '@/utils';
import i18n from '@/lang';

import emitter, { Events } from '@/events';

export async function uploadFile(
	file: File,
	onProgressChange?: (percentage: number) => void,
	showNotifications = true
) {
	const progressHandler = onProgressChange || (() => undefined);
	const formData = new FormData();
	formData.append('file', file);

	try {
		const response = await api.post(`/files`, formData, {
			onUploadProgress,
		});

		if (showNotifications) {
			notify({
				title: i18n.t('upload_file_success'),
				type: 'success',
			});
		}

		emitter.emit(Events.upload);

		return response.data.data;
	} catch (error) {
		if (showNotifications) {
			notify({
				title: i18n.t('upload_file_failed'),
			});
		}
	}

	function onUploadProgress(progressEvent: { loaded: number; total: number }) {
		const percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
		progressHandler(percentCompleted);
	}
}

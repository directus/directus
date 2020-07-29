import api from '@/api';

import notify from '@/utils/notify';
import i18n from '@/lang';

export default async function uploadFile(
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

		return response;
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

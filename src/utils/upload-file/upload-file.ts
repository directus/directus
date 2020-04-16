import api from '@/api';
import useProjectsStore from '@/stores/projects';
import notify from '@/utils/notify';
import i18n from '@/lang';

export default async function uploadFile(
	file: File,
	onProgressChange?: (percentage: number) => void,
	showNotifications = true
) {
	const progressHandler = onProgressChange || (() => undefined);
	const currentProjectKey = useProjectsStore().state.currentProjectKey;
	const formData = new FormData();
	formData.append('file', file);

	try {
		await api.post(`/${currentProjectKey}/files`, formData, { onUploadProgress });

		if (showNotifications) {
			notify({
				title: i18n.tc('upload_file_success', 0),
				type: 'success',
			});
		}
	} catch (error) {
		if (showNotifications) {
			notify({
				title: i18n.tc('upload_file_failed', 0),
			});
		}
	}

	function onUploadProgress(progressEvent: { loaded: number; total: number }) {
		const percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
		progressHandler(percentCompleted);
	}
}

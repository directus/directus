import api from '@/api';
import i18n from '@/lang';
import { notify } from '@/utils/notify';

import emitter, { Events } from '@/events';
import { unexpectedError } from '../unexpected-error';

export default async function uploadFile(
	file: File,
	options?: {
		onProgressChange?: (percentage: number) => void;
		notifications?: boolean;
		preset?: Record<string, any>;
		fileId?: string;
	}
): Promise<any> {
	const progressHandler = options?.onProgressChange || (() => undefined);
	const formData = new FormData();

	if (options?.preset) {
		for (const [key, value] of Object.entries(options.preset)) {
			formData.append(key, value);
		}
	}

	formData.append('file', file);

	try {
		let response = null;

		if (options?.fileId) {
			response = await api.patch(`/files/${options.fileId}`, formData, {
				onUploadProgress,
			});
		} else {
			response = await api.post(`/files`, formData, {
				onUploadProgress,
			});
		}

		if (options?.notifications) {
			notify({
				title: i18n.t('upload_file_success'),
				type: 'success',
			});
		}

		emitter.emit(Events.upload);

		return response.data.data;
	} catch (err) {
		unexpectedError(err);
	}

	function onUploadProgress(progressEvent: { loaded: number; total: number }) {
		const percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
		progressHandler(percentCompleted);
	}
}

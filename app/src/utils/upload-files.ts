import { uploadFile, notify } from '@/utils';
import i18n from '@/lang';

export async function uploadFiles(files: File[], onProgressChange?: (percentages: number[]) => void) {
	const progressHandler = onProgressChange || (() => undefined);

	const progressForFiles = files.map(() => 0);

	try {
		const uploadedFiles = await Promise.all(
			files.map((file, index) =>
				uploadFile(
					file,
					(percentage: number) => {
						progressForFiles[index] = percentage;
						progressHandler(progressForFiles);
					},
					false
				)
			)
		);

		notify({
			title: i18n.t('upload_files_success', { count: files.length }),
			type: 'success',
		});

		return uploadedFiles;
	} catch (error) {
		notify({
			title: i18n.t('upload_files_failed', { count: files.length }),
			type: 'error',
		});
	}
}

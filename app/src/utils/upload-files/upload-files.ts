import uploadFile from '@/utils/upload-file';
import notify from '@/utils/notify';
import i18n from '@/lang';

export default async function uploadFiles(
	files: File[],
	options?: {
		onProgressChange?: (percentages: number[]) => void;
		notifications?: boolean;
		preset?: Record<string, any>;
	}
) {
	const progressHandler = options?.onProgressChange || (() => undefined);
	const progressForFiles = files.map(() => 0);

	try {
		const uploadedFiles = await Promise.all(
			files.map((file, index) =>
				uploadFile(file, {
					...options,
					onProgressChange: (percentage: number) => {
						progressForFiles[index] = percentage;
						progressHandler(progressForFiles);
					},
				})
			)
		);

		if (options?.notifications) {
			notify({
				title: i18n.t('upload_files_success', { count: files.length }),
				type: 'success',
			});
		}

		return uploadedFiles;
	} catch (error) {
		if (options?.notifications) {
			notify({
				title: i18n.t('upload_files_failed', { count: files.length }),
				type: 'error',
			});
		}

		throw error;
	}
}

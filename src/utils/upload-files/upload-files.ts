import uploadFile from '@/utils/upload-file';
import notify from '@/utils/notify';
import i18n from '@/lang';

export default async function uploadFiles(
	files: File[],
	onProgressChange?: (percentages: number[]) => void
) {
	const progressHandler = onProgressChange || (() => undefined);

	const progressForFiles = files.map(() => 0);

	try {
		await Promise.all(
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
			title: i18n.tc('upload_file_success', files.length, { count: files.length }),
			type: 'success',
		});
	} catch (error) {
		notify({
			title: i18n.tc('upload_file_failed', files.length, { count: files.length }),
			type: 'error',
		});
	}
}

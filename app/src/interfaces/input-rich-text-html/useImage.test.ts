import { File, SettingsStorageAssetPreset } from '@directus/types';
import { expect, test } from 'vitest';
import { ref } from 'vue';
import useImage from './useImage';

const imageFile: File = {
	id: 'unique_id',
	storage: 'local',
	filename_disk: 'unique_id.svg',
	filename_download: '600x400.svg',
	title: 'Test Image',
	type: 'image/svg+xml',
	folder: null,
	uploaded_by: 'user',
	uploaded_on: '2024-06-14T23:59:59.000Z',
	modified_by: null,
	modified_on: '2024-06-14T23:59:59.001Z',
	charset: null,
	filesize: 100,
	width: null,
	height: null,
	duration: null,
	embed: null,
	description: null,
	location: null,
	tags: null,
	metadata: null,
	focal_point_x: null,
	focal_point_y: null,
	created_on: '2024-06-14T23:59:59.000Z',
	tus_id: null,
	tus_data: null,
};

const fileExtensions = ['jpeg', 'jpg'];

test('Returns the file id and file extension from the file type as the imageUrl', () => {
	const editorRef = ref<any | null>(null);
	const imageToken = ref<string>('');
	const storageAssetTransform = ref('all');
	const storageAssetPresets = ref<SettingsStorageAssetPreset[]>([]);

	const { imageSelection, onImageSelect } = useImage(editorRef, imageToken, {
		storageAssetTransform,
		storageAssetPresets,
	});

	onImageSelect(imageFile);

	expect(imageSelection.value?.imageUrl).toEqual('http://localhost:3000/assets/unique_id.svg');
});

test('Returns the file id and file extension from the filename_download as the imageUrl', () => {
	const editorRef = ref<any | null>(null);
	const imageToken = ref<string>('');
	const storageAssetTransform = ref('all');
	const storageAssetPresets = ref<SettingsStorageAssetPreset[]>([]);

	const { imageSelection, onImageSelect } = useImage(editorRef, imageToken, {
		storageAssetTransform,
		storageAssetPresets,
	});

	onImageSelect({ ...imageFile, type: null });

	expect(imageSelection.value?.imageUrl).toEqual('http://localhost:3000/assets/unique_id.svg');
});

test.each(fileExtensions)('Returns the correct file extension for %s', (fileExtension) => {
	const editorRef = ref<any | null>(null);
	const imageToken = ref<string>('');
	const storageAssetTransform = ref('all');
	const storageAssetPresets = ref<SettingsStorageAssetPreset[]>([]);

	const { imageSelection, onImageSelect } = useImage(editorRef, imageToken, {
		storageAssetTransform,
		storageAssetPresets,
	});

	onImageSelect({
		...imageFile,
		type: `image/${fileExtension}`,
		filename_disk: 'unique_id.' + fileExtension,
		filename_download: '600x400.' + fileExtension,
	});

	expect(imageSelection.value?.imageUrl).toEqual(`http://localhost:3000/assets/unique_id.${fileExtension}`);
});

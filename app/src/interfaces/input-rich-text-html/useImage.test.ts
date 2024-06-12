import { test, expect } from 'vitest';
import { ref } from 'vue';
import { SettingsStorageAssetPreset, File } from '@directus/types';
import useImage from './useImage';

test('Returns the filename_disk as the imageUrl', () => {
	const editorRef = ref<any | null>(null);
	const imageToken = ref<string>('')
	const storageAssetTransform = ref('all');
	const storageAssetPresets = ref<SettingsStorageAssetPreset[]>([]);

	const imageFile: File = {
    id: "test_image",
    storage: "local",
    filename_disk: "test_image.svg",
    filename_download: "600x400",
    title: "Test Image",
    type: "image/svg+xml; charset=utf-8",
    folder: null,
    uploaded_by: "user",
    uploaded_on: "2024-06-12T22:22:54.065Z",
    modified_by: null,
    modified_on: "2024-06-12T22:22:54.100Z",
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
    focal_point_y: null
	};

	const { imageSelection, onImageSelect } = useImage(editorRef, imageToken, {
		storageAssetTransform,
		storageAssetPresets
	});

	onImageSelect(imageFile)

	expect(imageSelection.value?.imageUrl).toEqual('http://localhost:3000/assets/test_image.svg')
})

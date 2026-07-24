import type { File, SettingsStorageAssetPreset } from '@directus/types';
import { Editor } from '@tiptap/vue-3';
import { afterEach, expect, test } from 'vitest';
import { ref, shallowRef } from 'vue';
import { editorExtensions } from '../extensions';
import { useImage } from './use-image';

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

const editors: Editor[] = [];

afterEach(() => {
	while (editors.length) editors.pop()!.destroy();
});

function setup(
	overrides: { content?: string; transform?: string; presets?: SettingsStorageAssetPreset[]; token?: string } = {},
) {
	const editor = shallowRef(new Editor({ extensions: editorExtensions, content: overrides.content ?? '<p></p>' }));
	editors.push(editor.value);
	const imageToken = ref(overrides.token ?? '');
	const storageAssetTransform = ref(overrides.transform ?? 'all');
	const storageAssetPresets = ref<SettingsStorageAssetPreset[]>(overrides.presets ?? []);

	const usable = useImage(editor, imageToken, { storageAssetTransform, storageAssetPresets });

	return { editor, ...usable };
}

test('Returns the file id and file extension from the file type as the imageUrl', () => {
	const { imageSelection, onImageSelect } = setup();

	onImageSelect(imageFile);

	expect(imageSelection.value?.imageUrl).toEqual('http://localhost:3000/assets/unique_id.svg');
});

test('Returns the file id and file extension from the filename_download as the imageUrl', () => {
	const { imageSelection, onImageSelect } = setup();

	onImageSelect({ ...imageFile, type: null });

	expect(imageSelection.value?.imageUrl).toEqual('http://localhost:3000/assets/unique_id.svg');
});

test.each(fileExtensions)('Returns the correct file extension for %s', (fileExtension) => {
	const { imageSelection, onImageSelect } = setup();

	onImageSelect({
		...imageFile,
		type: `image/${fileExtension}`,
		filename_disk: 'unique_id.' + fileExtension,
		filename_download: '600x400.' + fileExtension,
	});

	expect(imageSelection.value?.imageUrl).toEqual(`http://localhost:3000/assets/unique_id.${fileExtension}`);
});

test('Adds an access token to the asset URL when imageToken is set', () => {
	const { imageSelection, onImageSelect } = setup({ token: 'abc123' });

	onImageSelect(imageFile);

	expect(imageSelection.value?.imageUrl).toEqual('http://localhost:3000/assets/unique_id.svg?access_token=abc123');
});

test('saveImage inserts an img with transform query params, alt and loading="lazy"', () => {
	const { editor, imageSelection, saveImage } = setup();

	imageSelection.value = {
		imageUrl: 'http://localhost:3000/assets/abc.jpg',
		alt: 'My alt',
		lazy: true,
		width: 100,
		height: 80,
		transformationKey: null,
	};

	saveImage();

	const html = editor.value.getHTML();
	expect(html).toContain('<img');
	expect(html).toContain('src="http://localhost:3000/assets/abc.jpg?width=100&amp;height=80"');
	expect(html).toContain('alt="My alt"');
	expect(html).toContain('loading="lazy"');
});

test('saveImage omits loading when not lazy', () => {
	const { editor, imageSelection, saveImage } = setup();

	imageSelection.value = {
		imageUrl: 'http://localhost:3000/assets/abc.jpg',
		alt: 'My alt',
		lazy: false,
		width: 100,
		height: 80,
		transformationKey: null,
	};

	saveImage();

	expect(editor.value.getHTML()).not.toContain('loading');
});

test('saveImage uses the transformation key instead of width/height when set', () => {
	const { editor, imageSelection, saveImage } = setup();

	imageSelection.value = {
		imageUrl: 'http://localhost:3000/assets/abc.jpg',
		alt: 'My alt',
		lazy: false,
		width: 100,
		height: 80,
		transformationKey: 'my-preset',
	};

	saveImage();

	const html = editor.value.getHTML();
	expect(html).toContain('key=my-preset');
	expect(html).not.toContain('width=100');
});

test('openImageDrawer prefills the selection from the active image node', () => {
	const { editor, imageSelection, openImageDrawer } = setup({
		content: '<img src="http://localhost:3000/assets/abc.jpg?width=100&height=80" alt="My alt" loading="lazy">',
	});

	editor.value.commands.setNodeSelection(0);

	openImageDrawer();

	expect(imageSelection.value).toMatchObject({
		imageUrl: 'http://localhost:3000/assets/abc.jpg?width=100&height=80',
		alt: 'My alt',
		lazy: true,
		width: 100,
		height: 80,
	});
});

test('openImageDrawer leaves the selection empty when no image is active', () => {
	const { imageDrawerOpen, imageSelection, openImageDrawer } = setup({ content: '<p>text</p>' });

	openImageDrawer();

	expect(imageDrawerOpen.value).toBe(true);
	expect(imageSelection.value).toBeNull();
});

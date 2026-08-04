import type { File, SettingsStorageAssetPreset } from '@directus/types';
import { Editor } from '@tiptap/vue-3';
import { afterEach, expect, test } from 'vitest';
import { ref, shallowRef } from 'vue';
import { editorExtensions } from '../extensions';
import { type ImageSelection, useImage } from './use-image';

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

test('openImageDrawer prefills the caption from the figure the image sits in', () => {
	const { editor, imageSelection, openImageDrawer } = setup({
		content: '<figure><img src="/assets/abc.jpg" alt="My alt"><figcaption>A caption</figcaption></figure>',
	});

	editor.value.commands.setNodeSelection(1);

	openImageDrawer();

	expect(imageSelection.value?.caption).toBe('A caption');
});

test('openImageDrawer reports an empty caption for an image outside a figure', () => {
	const { editor, imageSelection, openImageDrawer } = setup({
		content: '<img src="/assets/abc.jpg" alt="My alt">',
	});

	editor.value.commands.setNodeSelection(0);

	openImageDrawer();

	expect(imageSelection.value?.caption).toBe('');
});

// the caption tests reuse one transformed src so the assertions stay about the figure structure
const SRC = 'http://localhost:3000/assets/abc.jpg';
const TRANSFORMED_SRC = `${SRC}?width=100&amp;height=80`;

function captionedSelection(overrides: Partial<ImageSelection> = {}): ImageSelection {
	return {
		imageUrl: SRC,
		alt: 'My alt',
		caption: 'A caption',
		lazy: false,
		width: 100,
		height: 80,
		transformationKey: null,
		...overrides,
	};
}

test('saveImage wraps a new image in a figure when a caption is set', () => {
	const { editor, imageSelection, saveImage } = setup();

	imageSelection.value = captionedSelection({ lazy: true });

	saveImage();

	expect(editor.value.getHTML()).toContain(
		`<figure><img src="${TRANSFORMED_SRC}" alt="My alt" loading="lazy"><figcaption>A caption</figcaption></figure>`,
	);
});

test('saveImage wraps an existing image when a caption is added', () => {
	const { editor, imageSelection, openImageDrawer, saveImage } = setup({ content: `<img src="${SRC}" alt="My alt">` });

	editor.value.commands.setNodeSelection(0);

	openImageDrawer();

	imageSelection.value = captionedSelection({ alt: 'New alt' });

	saveImage();

	expect(editor.value.getHTML()).toContain(
		`<figure><img src="${TRANSFORMED_SRC}" alt="New alt"><figcaption>A caption</figcaption></figure>`,
	);
});

test('saveImage updates the caption of an image already inside a figure', () => {
	const { editor, imageSelection, openImageDrawer, saveImage } = setup({
		content: `<figure><img src="${SRC}" alt="My alt"><figcaption>Old</figcaption></figure>`,
	});

	editor.value.commands.setNodeSelection(1);

	openImageDrawer();

	imageSelection.value = captionedSelection({ caption: 'New' });

	saveImage();

	expect(editor.value.getHTML()).toContain(
		`<figure><img src="${TRANSFORMED_SRC}" alt="My alt"><figcaption>New</figcaption></figure>`,
	);
});

test('saveImage unwraps the figure when the caption is cleared', () => {
	const { editor, imageSelection, openImageDrawer, saveImage } = setup({
		content: `<figure><img src="${SRC}" alt="My alt"><figcaption>A caption</figcaption></figure>`,
	});

	editor.value.commands.setNodeSelection(1);

	openImageDrawer();

	imageSelection.value = captionedSelection({ caption: '' });

	saveImage();

	const html = editor.value.getHTML();
	expect(html).toContain(`<img src="${TRANSFORMED_SRC}" alt="My alt">`);
	expect(html).not.toContain('figure');
});

test('saveImage keeps a figure that carries a class when the caption is cleared', () => {
	const { editor, imageSelection, openImageDrawer, saveImage } = setup({
		content: `<figure class="float-left"><img src="${SRC}" alt="My alt"><figcaption>A caption</figcaption></figure>`,
	});

	editor.value.commands.setNodeSelection(1);

	openImageDrawer();

	imageSelection.value = captionedSelection({ caption: '' });

	saveImage();

	expect(editor.value.getHTML()).toContain(
		`<figure class="float-left"><img src="${TRANSFORMED_SRC}" alt="My alt"></figure>`,
	);
});

test('saveImage keeps the preserved attributes of the image it edits', () => {
	const { editor, imageSelection, openImageDrawer, saveImage } = setup({
		content: `<img class="rounded" src="${SRC}" alt="My alt">`,
	});

	editor.value.commands.setNodeSelection(0);

	openImageDrawer();

	imageSelection.value = captionedSelection({ alt: 'New alt', caption: '' });

	saveImage();

	expect(editor.value.getHTML()).toContain(`<img class="rounded" src="${TRANSFORMED_SRC}" alt="New alt">`);
});

test('saveImage replaces a range selection that only partially covers an image', () => {
	const { editor, imageSelection, openImageDrawer, saveImage } = setup({
		content: `<p>hello</p><img src="/assets/old.jpg" alt="Old alt"><p>world</p>`,
	});

	editor.value.commands.selectAll();

	openImageDrawer();
	expect(imageSelection.value).toBeNull();

	imageSelection.value = captionedSelection({ alt: 'New alt', caption: '' });

	saveImage();

	const html = editor.value.getHTML();
	expect(html).toContain(`<img src="${TRANSFORMED_SRC}" alt="New alt">`);
	expect(html).not.toContain('old.jpg');
	expect(html).not.toContain('hello');
	expect(html).not.toContain('world');
});

test('saveImage replaces a range selection covering an image with a captioned figure', () => {
	const { editor, imageSelection, openImageDrawer, saveImage } = setup({
		content: `<p>hello</p><img src="/assets/old.jpg" alt="Old alt"><p>world</p>`,
	});

	editor.value.commands.selectAll();

	openImageDrawer();

	imageSelection.value = captionedSelection({ alt: 'New alt' });

	saveImage();

	const html = editor.value.getHTML();

	expect(html).toContain(
		`<figure><img src="${TRANSFORMED_SRC}" alt="New alt"><figcaption>A caption</figcaption></figure>`,
	);

	expect(html).not.toContain('old.jpg');
	expect(html).not.toContain('hello');
});

test('openImageDrawer leaves the selection empty when no image is active', () => {
	const { imageDrawerOpen, imageSelection, openImageDrawer } = setup({ content: '<p>text</p>' });

	openImageDrawer();

	expect(imageDrawerOpen.value).toBe(true);
	expect(imageSelection.value).toBeNull();
});

import type { File, SettingsStorageAssetPreset } from '@directus/types';
import { Editor } from '@tiptap/vue-3';
import { afterEach, describe, expect, test } from 'vitest';
import { ref, shallowRef } from 'vue';
import { editorExtensions } from '../extensions';
import { selectNode } from '../test-utils';
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

test('saveImage keeps the link of the image it edits', () => {
	const { editor, imageSelection, openImageDrawer, saveImage } = setup({
		content: `<a href="https://directus.io" target="_blank" rel="noopener noreferrer"><img src="${SRC}" alt="My alt"></a>`,
	});

	editor.value.commands.setNodeSelection(0);

	openImageDrawer();

	imageSelection.value = captionedSelection({ alt: 'New alt', caption: '' });

	saveImage();

	expect(editor.value.getHTML()).toContain(
		`<a href="https://directus.io" target="_blank" rel="noopener noreferrer"><img src="${TRANSFORMED_SRC}" alt="New alt"></a>`,
	);
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

describe('inline images', () => {
	const IMG = `<img src="${SRC}" alt="My alt">`;
	const NEW_IMG = `<img src="${TRANSFORMED_SRC}" alt="New alt">`;

	function edit(content: string, type: string, overrides: Partial<ImageSelection>) {
		const usable = setup({ content });
		selectNode(usable.editor.value, type);
		usable.openImageDrawer();

		usable.imageSelection.value = {
			...usable.imageSelection.value!,
			...captionedSelection({ alt: 'New alt', caption: '', ...overrides }),
		};

		usable.saveImage();
		return usable.editor.value.getHTML();
	}

	test('openImageDrawer prefills an inline image and reports it as inline', () => {
		const { editor, imageSelection, openImageDrawer } = setup({ content: `<p>a ${IMG} b</p>` });

		selectNode(editor.value, 'inlineImage');
		openImageDrawer();

		expect(imageSelection.value).toMatchObject({ imageUrl: SRC, alt: 'My alt', inline: true, inFigure: false });
	});

	test('openImageDrawer reports a block image as not inline', () => {
		const { editor, imageSelection, openImageDrawer } = setup({ content: IMG });

		selectNode(editor.value, 'image');
		openImageDrawer();

		expect(imageSelection.value).toMatchObject({ inline: false, inFigure: false });
	});

	test('openImageDrawer reports an image in a figure', () => {
		const { editor, imageSelection, openImageDrawer } = setup({ content: `<figure>${IMG}</figure>` });

		selectNode(editor.value, 'image');
		openImageDrawer();

		expect(imageSelection.value).toMatchObject({ inline: false, inFigure: true });
	});

	test('a new image is not inline by default', () => {
		const { imageSelection, onImageSelect } = setup();

		onImageSelect(imageFile);

		expect(imageSelection.value?.inline).toBe(false);
	});

	test('saveImage inserts a new inline image at the cursor', () => {
		const { editor, imageSelection, saveImage } = setup({ content: '<p>ab</p>' });

		editor.value.commands.setTextSelection(2);
		imageSelection.value = captionedSelection({ alt: 'New alt', caption: '', inline: true });
		saveImage();

		expect(editor.value.getHTML()).toBe(`<p>a${NEW_IMG}b</p>`);
	});

	test('saveImage edits an inline image in place, with its attributes and link', () => {
		const html = edit(
			`<p>a <a href="https://directus.io"><img class="icon" src="${SRC}" alt="My alt"></a> b</p>`,
			'inlineImage',
			{ inline: true },
		);

		expect(html).toBe(
			`<p>a <a href="https://directus.io"><img class="icon" src="${TRANSFORMED_SRC}" alt="New alt"></a> b</p>`,
		);
	});

	test('saveImage turns an inline image into a block image that splits the paragraph', () => {
		const html = edit(`<p>before ${IMG} after</p>`, 'inlineImage', { inline: false });

		expect(html).toBe(`<p>before </p>${NEW_IMG}<p> after</p>`);
	});

	test('saveImage moves the link of an inline image onto the block image', () => {
		const html = edit(
			`<p>a <a href="https://directus.io" target="_blank" rel="noopener noreferrer">${IMG}</a></p>`,
			'inlineImage',
			{ inline: false },
		);

		expect(html).toContain(`<a href="https://directus.io" target="_blank" rel="noopener noreferrer">${NEW_IMG}</a>`);
		expect(html).not.toContain('<p><a');
	});

	test('saveImage turns an inline image into a captioned figure', () => {
		const html = edit(`<p>a ${IMG}</p>`, 'inlineImage', { inline: false, caption: 'A caption' });

		expect(html).toContain(`<p>a </p><figure>${NEW_IMG}<figcaption>A caption</figcaption></figure>`);
	});

	test('saveImage turns a block image into an inline image in a new paragraph', () => {
		const html = edit(`<p>x</p>${IMG}<p>y</p>`, 'image', { inline: true });

		expect(html).toBe(`<p>x</p><p>${NEW_IMG}</p><p>y</p>`);
	});

	test('saveImage moves the link of a block image onto the Link mark', () => {
		const html = edit(
			`<a href="https://directus.io" target="_blank" rel="noopener noreferrer">${IMG}</a><p>y</p>`,
			'image',
			{ inline: true },
		);

		expect(html).toBe(
			`<p><a target="_blank" rel="noopener noreferrer" href="https://directus.io">${NEW_IMG}</a></p><p>y</p>`,
		);
	});

	test('saveImage keeps the preserved attributes when the type changes', () => {
		const html = edit(`<img class="rounded" data-x="1" src="${SRC}" alt="My alt"><p>y</p>`, 'image', { inline: true });

		expect(html).toBe(`<p><img class="rounded" data-x="1" src="${TRANSFORMED_SRC}" alt="New alt"></p><p>y</p>`);
	});

	test('saveImage keeps an image in a figure as a block image', () => {
		const html = edit(`<figure class="left">${IMG}</figure><p>y</p>`, 'image', { inline: true });

		expect(html).toBe(`<figure class="left">${NEW_IMG}</figure><p>y</p>`);
	});

	test('openImageDrawer reports an inline image in a figure paragraph as inline, without the figure caption', () => {
		const { editor, imageSelection, openImageDrawer } = setup({
			content: `<figure><p>a ${IMG} b</p><figcaption>c</figcaption></figure>`,
		});

		selectNode(editor.value, 'inlineImage');
		openImageDrawer();

		expect(imageSelection.value).toMatchObject({ inline: true, inFigure: false, caption: '' });
	});

	test('saveImage edits an inline image in a figure paragraph in place', () => {
		const html = edit(`<figure><p>a ${IMG} b</p><figcaption>c</figcaption></figure>`, 'inlineImage', {});

		expect(html).toBe(`<figure><p>a ${NEW_IMG} b</p><figcaption>c</figcaption></figure><p></p>`);
	});

	test('saveImage keeps the link title as the image title when an inline image becomes a block image', () => {
		const html = edit(`<p>a <a href="https://directus.io" title="Tip">${IMG}</a></p>`, 'inlineImage', {
			inline: false,
		});

		expect(html).toContain('title="Tip"');
	});

	test('saveImage ignores the caption of an inline image', () => {
		const html = edit(`<p>a ${IMG}</p>`, 'inlineImage', { inline: true, caption: 'A caption' });

		expect(html).toBe(`<p>a ${NEW_IMG}</p>`);
	});
});

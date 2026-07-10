import type { File } from '@directus/types';
import { Editor } from '@tiptap/vue-3';
import { afterEach, expect, test } from 'vitest';
import { nextTick, ref, shallowRef } from 'vue';
import { editorExtensions } from '../extensions';
import { useMedia } from './use-media';

const audioFile = { id: 'aud1', type: 'audio/mpeg', width: null, height: null } as unknown as File;
const videoFile = { id: 'vid1', type: 'video/mp4', width: 640, height: 360 } as unknown as File;

const editors: Editor[] = [];

afterEach(() => {
	while (editors.length) editors.pop()!.destroy();
});

function setup(overrides: { content?: string; token?: string } = {}) {
	const editor = shallowRef(new Editor({ extensions: editorExtensions, content: overrides.content ?? '<p></p>' }));
	editors.push(editor.value);
	const imageToken = ref(overrides.token ?? '');
	const usable = useMedia(editor, imageToken);
	return { editor, ...usable };
}

test('onMediaSelect maps audio MIME to the audio tag', () => {
	const { mediaSelection, onMediaSelect } = setup();
	onMediaSelect(audioFile);
	expect(mediaSelection.value?.tag).toBe('audio');
	expect(mediaSelection.value?.src).toBe('http://localhost:3000/assets/aud1');
});

test('onMediaSelect maps video MIME to the video tag with file dimensions', () => {
	const { mediaSelection, onMediaSelect } = setup();
	onMediaSelect(videoFile);
	expect(mediaSelection.value).toMatchObject({ tag: 'video', width: 640, height: 360 });
});

test('onMediaSelect ignores non-media files', () => {
	const { mediaSelection, onMediaSelect } = setup();
	onMediaSelect({ id: 'img1', type: 'image/png', width: 100, height: 100 } as unknown as File);
	expect(mediaSelection.value).toBeNull();
});

test('saveMedia (file tab) inserts a video node', () => {
	const { editor, mediaSelection, saveMedia } = setup();

	mediaSelection.value = {
		tag: 'video',
		src: 'http://localhost:3000/assets/vid1',
		type: 'video/mp4',
		width: 640,
		height: 360,
		controls: true,
		loop: false,
		previewUrl: null,
	};

	saveMedia();
	const html = editor.value.getHTML();
	expect(html).toContain('<video');
	expect(html).toContain('src="http://localhost:3000/assets/vid1"');
});

test('saveMedia (embed tab) parses iframe markup into a media node', () => {
	const { editor, embed, activeTab, saveMedia } = setup();
	activeTab.value = ['embed'];
	embed.value = '<iframe src="about:blank" width="560" height="315"></iframe>';
	saveMedia();
	expect(editor.value.getHTML()).toContain('src="about:blank"');
});

test('saveMedia (embed tab) rejects non-representable markup and flags it', () => {
	const { editor, embed, embedInvalid, mediaDrawerOpen, activeTab, saveMedia } = setup();
	mediaDrawerOpen.value = true;
	activeTab.value = ['embed'];
	embed.value = '<div>not media</div>';
	saveMedia();
	const html = editor.value.getHTML();
	expect(html).not.toContain('<iframe');
	expect(html).not.toContain('<video');
	expect(embedInvalid.value).toBe(true);
	expect(mediaDrawerOpen.value).toBe(true);
});

test('editing the embed markup clears the invalid flag', async () => {
	const { embed, embedInvalid, activeTab, saveMedia } = setup();
	activeTab.value = ['embed'];
	embed.value = '<div>not media</div>';
	saveMedia();
	expect(embedInvalid.value).toBe(true);

	embed.value = '<iframe src="about:blank"></iframe>';
	await nextTick();
	expect(embedInvalid.value).toBe(false);
});

test('closing the drawer clears the invalid flag', () => {
	const { embed, embedInvalid, activeTab, saveMedia, closeMediaDrawer } = setup();
	activeTab.value = ['embed'];
	embed.value = 'broken';
	saveMedia();
	expect(embedInvalid.value).toBe(true);

	closeMediaDrawer();
	expect(embedInvalid.value).toBe(false);
});

test('saveMedia (embed tab) does not flag an empty embed', () => {
	const { embedInvalid, activeTab, saveMedia } = setup();
	activeTab.value = ['embed'];
	saveMedia();
	expect(embedInvalid.value).toBe(false);
});

test('openMediaDrawer prefills the selection from the active media node', () => {
	const { editor, mediaSelection, openMediaDrawer } = setup({
		content: '<video width="640" height="360" controls><source src="/assets/v.mp4" type="video/mp4"></video>',
	});

	editor.value.commands.setNodeSelection(0);
	openMediaDrawer();

	expect(mediaSelection.value).toMatchObject({
		tag: 'video',
		src: '/assets/v.mp4',
		type: 'video/mp4',
		width: 640,
		height: 360,
	});
});

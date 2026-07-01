import type { File } from '@directus/types';
import { Editor } from '@tiptap/vue-3';
import { afterEach, expect, test, vi } from 'vitest';
import { ref, shallowRef } from 'vue';
import { editorExtensions } from '../extensions';
import { useMedia } from './use-media';

vi.mock('@/stores/notifications', () => ({
	useNotificationsStore: () => ({ add: vi.fn() }),
}));

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
	embed.value = '<iframe src="https://example.com/x" width="560" height="315"></iframe>';
	saveMedia();
	expect(editor.value.getHTML()).toContain('src="https://example.com/x"');
});

test('saveMedia (embed tab) rejects non-representable markup', () => {
	const { editor, embed, activeTab, saveMedia } = setup();
	activeTab.value = ['embed'];
	embed.value = '<div>not media</div>';
	saveMedia();
	const html = editor.value.getHTML();
	expect(html).not.toContain('<iframe');
	expect(html).not.toContain('<video');
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

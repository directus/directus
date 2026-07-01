import { Editor } from '@tiptap/vue-3';
import { afterEach, describe, expect, test } from 'vitest';
import { editorExtensions } from './index';

const editors: Editor[] = [];

afterEach(() => {
	while (editors.length) editors.pop()!.destroy();
});

function roundTrip(html: string): string {
	const editor = new Editor({ extensions: editorExtensions, content: html });
	editors.push(editor);
	return editor.getHTML();
}

describe('media node: parse + render', () => {
	test('video with source child preserves src/type/controls', () => {
		const out = roundTrip(
			'<video width="640" height="360" controls><source src="/assets/v.mp4" type="video/mp4"></video>',
		);

		expect(out).toContain('<video');
		expect(out).toContain('width="640"');
		expect(out).toContain('height="360"');
		expect(out).toContain('controls=""');
		expect(out).toContain('<source src="/assets/v.mp4" type="video/mp4">');
	});

	test('audio preserves loop + controls (bare attrs normalized to ="")', () => {
		const out = roundTrip('<audio loop controls><source src="/assets/a.mp3" type="audio/mpeg"></audio>');
		expect(out).toContain('<audio');
		expect(out).toContain('loop=""');
		expect(out).toContain('controls=""');
		expect(out).toContain('<source src="/assets/a.mp3" type="audio/mpeg">');
	});

	test('iframe preserves src/width/height and has no source child', () => {
		const out = roundTrip('<iframe src="about:blank" width="560" height="315"></iframe>');
		expect(out).toContain('<iframe');
		expect(out).toContain('src="about:blank"');
		expect(out).toContain('width="560"');
		expect(out).toContain('height="315"');
		expect(out).not.toContain('<source');
	});

	test('non-media markup produces no media node', () => {
		const out = roundTrip('<p>hello</p>');
		expect(out).not.toContain('<video');
		expect(out).not.toContain('<audio');
		expect(out).not.toContain('<iframe');
	});
});

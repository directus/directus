import { type AnyExtension, Editor } from '@tiptap/vue-3';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { roundTrip } from '../composables/normalization-diff';
import { buildLinkProtocolSchema } from './link-protocols';
import { fieldEditorExtensions } from '.';

const TEXT_LINK = '<p><a href="myapp://some/route">open</a></p>';
// a block after the image keeps StarterKit's trailing-node paragraph out of the expected HTML
const IMAGE_LINK = '<a href="myapp://some/route"><img src="/assets/abc"></a><p>y</p>';

const editors: Editor[] = [];

afterEach(() => {
	while (editors.length) editors.pop()!.destroy();
});

// roundTrip destroys its editor before Tiptap's create tick, so only a mounted editor runs onCreate
async function mounted(extensions: AnyExtension[]): Promise<Editor> {
	const editor = new Editor({ extensions: fieldEditorExtensions(extensions) });
	editors.push(editor);
	await new Promise((resolve) => setTimeout(resolve));
	return editor;
}

describe('buildLinkProtocolSchema', () => {
	test('drops a text link with a custom scheme that is not allowed', () => {
		expect(roundTrip(TEXT_LINK)).toBe('<p>open</p>');
	});

	test('keeps a text link with an allowed custom scheme', () => {
		const { extensions } = buildLinkProtocolSchema(['myapp']);
		expect(roundTrip(TEXT_LINK, extensions)).toBe(TEXT_LINK);
	});

	test('keeps an image link with an allowed custom scheme', () => {
		const { extensions } = buildLinkProtocolSchema(['myapp']);
		expect(roundTrip(IMAGE_LINK, extensions)).toBe(IMAGE_LINK);
	});

	test('still keeps links with the default schemes', () => {
		const { extensions } = buildLinkProtocolSchema(['myapp']);
		const html = '<p><a href="https://directus.io">a</a> <a href="mailto:a@b.c">b</a></p>';
		expect(roundTrip(html, extensions)).toBe(html);
	});

	test('accepts schemes entered with a trailing colon or slashes and in any case', () => {
		const { extensions } = buildLinkProtocolSchema([' MyApp:// ', 'other:']);
		const html = '<p><a href="myapp://x">a</a> <a href="other:y">b</a></p>';
		expect(roundTrip(html, extensions)).toBe(html);
	});

	test('keys an empty or missing list as the base schema', () => {
		const empty = { extensions: [], protocols: [], key: '' };
		expect(buildLinkProtocolSchema([])).toEqual(empty);
		expect(buildLinkProtocolSchema(null)).toEqual(empty);
		expect(buildLinkProtocolSchema(['', '  '])).toEqual(empty);
	});

	test('keys two lists apart and the same list in any order alike', () => {
		expect(buildLinkProtocolSchema(['myapp']).key).not.toBe(buildLinkProtocolSchema(['other']).key);
		expect(buildLinkProtocolSchema(['a', 'b']).key).toBe(buildLinkProtocolSchema(['b', 'a']).key);
	});

	test('mounts an editor with dotted and plus schemes and keeps their links', async () => {
		const { extensions } = buildLinkProtocolSchema(['com.example.app', 'web+app']);
		const editor = await mounted(extensions);
		const html = '<p><a href="com.example.app://x">a</a> <a href="web+app:y">b</a></p>';

		expect(editor.isInitialized).toBe(true);
		expect(roundTrip(html, extensions)).toBe(html);
	});

	test('never allows script schemes', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { extensions, protocols } = buildLinkProtocolSchema(['JavaScript:', 'vbscript', 'data', 'myapp']);

		expect(protocols).toEqual(['myapp']);
		expect(roundTrip('<p><a href="javascript:alert(1)">open</a></p>', extensions)).toBe('<p>open</p>');
		expect(warn).toHaveBeenCalledTimes(3);

		warn.mockRestore();
	});

	test('warns about entries that are not URL schemes', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		expect(buildLinkProtocolSchema(['myapp', '1bad', 'no spaces']).protocols).toEqual(['myapp']);
		expect(warn).toHaveBeenCalledTimes(2);

		warn.mockRestore();
	});
});

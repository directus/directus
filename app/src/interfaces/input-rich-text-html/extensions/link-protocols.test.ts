import { type AnyExtension, Editor } from '@tiptap/vue-3';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { roundTrip } from '../composables/normalization-diff';
import { buildLinkProtocols } from './link-protocols';
import { mergeEditorExtensions } from '.';

const TEXT_LINK = '<p><a href="myapp://some/route">open</a></p>';
// a block after the image keeps StarterKit's trailing-node paragraph out of the expected HTML
const IMAGE_LINK = '<a href="myapp://some/route"><img src="/assets/abc"></a><p>y</p>';

const editors: Editor[] = [];

afterEach(() => {
	while (editors.length) editors.pop()!.destroy();
});

// roundTrip destroys its editor before Tiptap's create tick, so only a mounted editor runs onCreate
async function mounted(extensions: AnyExtension[]): Promise<Editor> {
	const editor = new Editor({ extensions: mergeEditorExtensions(extensions) });
	editors.push(editor);
	await new Promise((resolve) => setTimeout(resolve));
	return editor;
}

describe('buildLinkProtocols', () => {
	test('drops a text link with a custom scheme that is not allowed', () => {
		expect(roundTrip(TEXT_LINK)).toBe('<p>open</p>');
	});

	test('keeps a text link with an allowed custom scheme', () => {
		const { extensions } = buildLinkProtocols(['myapp']);
		expect(roundTrip(TEXT_LINK, extensions)).toBe(TEXT_LINK);
	});

	test('keeps an image link with an allowed custom scheme', () => {
		const { extensions } = buildLinkProtocols(['myapp']);
		expect(roundTrip(IMAGE_LINK, extensions)).toBe(IMAGE_LINK);
	});

	test('still keeps links with the default schemes', () => {
		const { extensions } = buildLinkProtocols(['myapp']);
		const html = '<p><a href="https://directus.io">a</a> <a href="mailto:a@b.c">b</a></p>';
		expect(roundTrip(html, extensions)).toBe(html);
	});

	test('accepts schemes entered with a trailing colon or slashes and in any case', () => {
		const { extensions } = buildLinkProtocols([' MyApp:// ', 'other:']);
		const html = '<p><a href="myapp://x">a</a> <a href="other:y">b</a></p>';
		expect(roundTrip(html, extensions)).toBe(html);
	});

	test('keys an empty or missing list as the base schema', () => {
		const empty = { extensions: [], protocols: [], key: '' };
		expect(buildLinkProtocols([])).toEqual(empty);
		expect(buildLinkProtocols(null)).toEqual(empty);
		expect(buildLinkProtocols(['', '  '])).toEqual(empty);
	});

	test('keys two lists apart and the same list in any order alike', () => {
		expect(buildLinkProtocols(['myapp']).key).not.toBe(buildLinkProtocols(['other']).key);
		expect(buildLinkProtocols(['a', 'b']).key).toBe(buildLinkProtocols(['b', 'a']).key);
	});

	test('mounts an editor with schemes linkify cannot register and keeps their links', async () => {
		const { extensions } = buildLinkProtocols(['com.example.app', 'web+app']);
		const editor = await mounted(extensions);
		const html = '<p><a href="com.example.app://x">a</a> <a href="web+app:y">b</a></p>';

		expect(editor.isInitialized).toBe(true);
		expect(roundTrip(html, extensions)).toBe(html);
	});

	test('keeps autolinking an allowed custom scheme after a round-trip check', async () => {
		const { extensions } = buildLinkProtocols(['myapp']);
		const editor = await mounted(extensions);

		roundTrip(TEXT_LINK, extensions);
		editor.commands.insertContent('myapp://some/route ');

		expect(editor.getHTML()).toContain('<a href="myapp://some/route">');
	});

	test('accepts the option as a comma-separated string', () => {
		expect(buildLinkProtocols('myapp, other').protocols).toEqual(['myapp', 'other']);
	});

	test('warns about entries that are not URL schemes', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		expect(buildLinkProtocols(['myapp', '1bad', 'no spaces']).protocols).toEqual(['myapp']);
		expect(warn).toHaveBeenCalledTimes(2);

		warn.mockRestore();
	});
});

import { Editor } from '@tiptap/vue-3';
import { describe, expect, test } from 'vitest';
import { editorExtensions } from '.';

function roundTrip(html: string): string {
	const editor = new Editor({ extensions: editorExtensions, content: html });
	const out = editor.getHTML();
	editor.destroy();
	return out;
}

describe('link schemes', () => {
	test.each([
		'<p><a href="myapp://some/route">deep link</a></p>',
		'<p><a href="com.example.app:path">reverse-domain scheme</a></p>',
		'<p><a href="https://directus.io">https</a></p>',
		'<p><a href="mailto:hi@directus.io">mailto</a></p>',
		'<p><a href="/relative/path">relative</a></p>',
		'<a href="myapp://some/route"><img src="/assets/abc" alt="a"></a>',
	])('%s survives round-trip unchanged', (html) => {
		expect(roundTrip(html)).toBe(html);
	});

	test.each([
		'javascript:alert(1)',
		'JaVaScRiPt:alert(1)',
		' java\tscript:alert(1)',
		'vbscript:msgbox(1)',
		'data:text/html,<script>alert(1)</script>',
		'mhtml:file://C:/x.mht',
	])('script-capable href %s is dropped', (href) => {
		const editor = new Editor({ extensions: editorExtensions, content: '<p></p>' });
		editor.commands.setContent(`<p><a href="${href.replace(/</g, '&lt;')}">x</a></p>`);
		expect(editor.getHTML()).toBe('<p>x</p>');
		editor.destroy();
	});

	test('setLink accepts a custom scheme', () => {
		const editor = new Editor({ extensions: editorExtensions, content: '<p>text</p>' });
		editor.chain().selectAll().setLink({ href: 'myapp://route' }).run();
		expect(editor.getHTML()).toBe('<p><a href="myapp://route">text</a></p>');
		editor.destroy();
	});
});

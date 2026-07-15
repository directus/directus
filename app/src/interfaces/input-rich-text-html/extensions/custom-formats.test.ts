import { Editor } from '@tiptap/vue-3';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { buildCustomFormats } from './custom-formats';
import { editorExtensions } from './index';

const SAMPLE = [
	{
		title: 'Highlight',
		inline: 'span',
		classes: 'hl',
		styles: { color: '#00ff00', 'font-size': '20px' },
		attributes: { title: 'Highlighted' },
	},
];

function editorWith(raw: unknown, content = '') {
	const { extensions } = buildCustomFormats(raw);
	return new Editor({ extensions: [...editorExtensions, ...extensions], content });
}

afterEach(() => vi.restoreAllMocks());

describe('buildCustomFormats: parsing the option', () => {
	test('maps each valid entry to one mark + one toolbar format', () => {
		const { extensions, formats } = buildCustomFormats(SAMPLE);
		expect(extensions).toHaveLength(1);
		expect(formats).toHaveLength(1);
		expect(formats[0]!.title).toBe('Highlight');
		expect(typeof formats[0]!.name).toBe('string');
	});

	test('accepts a JSON string (code interface may hand back a string)', () => {
		const { formats } = buildCustomFormats(JSON.stringify(SAMPLE));
		expect(formats).toHaveLength(1);
		expect(formats[0]!.title).toBe('Highlight');
	});

	test('returns empty for null/undefined/garbage input', () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});

		expect(buildCustomFormats(null).formats).toHaveLength(0);
		expect(buildCustomFormats(undefined).extensions).toHaveLength(0);
		expect(buildCustomFormats('not json').formats).toHaveLength(0);
		expect(buildCustomFormats([]).extensions).toHaveLength(0);
	});

	test('warns when the option itself cannot be parsed, but not for unset/empty values', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		buildCustomFormats(null);
		buildCustomFormats(undefined);
		buildCustomFormats('');
		expect(warn).not.toHaveBeenCalled();

		buildCustomFormats('not json');
		buildCustomFormats('{"an":"object"}');
		expect(warn).toHaveBeenCalledTimes(2);
	});

	test('skips unsupported (block-level / missing inline) entries with a warning', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const { extensions, formats } = buildCustomFormats([
			{ title: 'Block heading', block: 'h1' },
			{ title: 'No tag' },
			SAMPLE[0],
		]);

		expect(extensions).toHaveLength(1);
		expect(formats).toHaveLength(1);
		expect(warn).toHaveBeenCalled();
	});

	test('skips entries without a classes/attributes anchor with a warning (cannot round-trip)', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const { formats } = buildCustomFormats([
			{ title: 'Bare', inline: 'span' },
			{ title: 'Styles only', inline: 'span', styles: { color: 'red' } },
			SAMPLE[0],
		]);

		expect(formats).toHaveLength(1);
		expect(formats[0]!.title).toBe('Highlight');
		expect(warn).toHaveBeenCalledTimes(2);
	});

	test('exposes the inline styles as a preview string for the toolbar dropdown', () => {
		const { formats } = buildCustomFormats(SAMPLE);
		expect(formats[0]!.previewStyle).toContain('color: #00ff00');
		expect(formats[0]!.previewStyle).toContain('font-size: 20px');
	});

	test('previewStyle is undefined when a format has no styles', () => {
		const { formats } = buildCustomFormats([{ title: 'Plain', inline: 'span', classes: 'plain' }]);
		expect(formats[0]!.previewStyle).toBeUndefined();
	});

	test('assigns each format a distinct mark name', () => {
		const { formats } = buildCustomFormats([
			{ title: 'A', inline: 'span', classes: 'a' },
			{ title: 'B', inline: 'span', classes: 'b' },
		]);

		expect(new Set(formats.map((f) => f.name)).size).toBe(2);
	});
});

describe('buildCustomFormats: applying a format', () => {
	test('wraps the selection in the configured tag, class, styles and attributes', () => {
		const { extensions, formats } = buildCustomFormats(SAMPLE);
		const editor = new Editor({ extensions: [...editorExtensions, ...extensions], content: '<p>hello</p>' });
		editor.commands.selectAll();
		editor.commands.toggleMark(formats[0]!.name);

		const html = editor.getHTML();
		editor.destroy();

		expect(html).toContain('class="hl"');
		expect(html).toContain('color: #00ff00');
		expect(html).toContain('font-size: 20px');
		expect(html).toContain('title="Highlighted"');
	});

	test('toggling the mark off removes the format', () => {
		const { extensions, formats } = buildCustomFormats(SAMPLE);
		const editor = new Editor({ extensions: [...editorExtensions, ...extensions], content: '<p>hello</p>' });
		editor.commands.selectAll();
		editor.commands.toggleMark(formats[0]!.name);
		editor.commands.selectAll();
		editor.commands.toggleMark(formats[0]!.name);

		const html = editor.getHTML();
		editor.destroy();

		expect(html).not.toContain('hl');
	});
});

describe('buildCustomFormats: round-trip + active state', () => {
	test('a configured custom-format span round-trips as a single span', () => {
		const editor = editorWith(
			SAMPLE,
			'<p><span class="hl" style="color: #00ff00; font-size: 20px;" title="Highlighted">x</span></p>',
		);

		const out = editor.getHTML();
		editor.destroy();

		expect(out).toBe('<p><span class="hl" style="color: #00ff00; font-size: 20px;" title="Highlighted">x</span></p>');
	});

	test('coexists with text color: format applied over colored text keeps the color', () => {
		const { extensions, formats } = buildCustomFormats(SAMPLE);

		const editor = new Editor({
			extensions: [...editorExtensions, ...extensions],
			content: '<p><span style="color: red">hi</span></p>',
		});

		editor.commands.selectAll();
		editor.commands.toggleMark(formats[0]!.name);
		const html = editor.getHTML();
		editor.destroy();

		expect(html).toContain('class="hl"');
		expect(html).toContain('color: red');
	});

	test('coexists with text color: color applied over a format keeps the format', () => {
		const { extensions, formats } = buildCustomFormats(SAMPLE);
		const editor = new Editor({ extensions: [...editorExtensions, ...extensions], content: '<p>hi</p>' });

		editor.commands.selectAll();
		editor.commands.toggleMark(formats[0]!.name);
		editor.commands.selectAll();
		editor.commands.setColor('red');
		const html = editor.getHTML();
		editor.destroy();

		expect(html).toContain('class="hl"');
		expect(html).toContain('color: red');
	});

	test('a format span nested with a color span round-trips', () => {
		const editor = editorWith(SAMPLE, '<p><span class="hl"><span style="color: red">hi</span></span></p>');
		const out = editor.getHTML();
		editor.destroy();

		expect(out).toContain('class="hl"');
		expect(out).toContain('color: red');
	});

	test('an unconfigured class span is preserved instead of dropped', () => {
		const editor = editorWith([], '<p><span class="unknown">x</span></p>');
		const out = editor.getHTML();
		editor.destroy();

		expect(out).toBe('<p><span class="unknown">x</span></p>');
	});

	test('reports active when the selection sits inside a configured format', () => {
		const { extensions, formats } = buildCustomFormats(SAMPLE);

		const editor = new Editor({
			extensions: [...editorExtensions, ...extensions],
			content: '<p><span class="hl" style="color: #00ff00; font-size: 20px;" title="Highlighted">x</span></p>',
		});

		editor.commands.selectAll();
		const active = editor.isActive(formats[0]!.name);
		editor.destroy();

		expect(active).toBe(true);
	});
});

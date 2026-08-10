import { Editor } from '@tiptap/vue-3';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
	type BlockCustomFormat,
	buildCustomFormats,
	type CustomFormat,
	type GroupCustomFormat,
} from './custom-formats';
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

/** Narrow to a selectable (non-group) format so `name`/`previewStyle` are visible. */
function leafAt(formats: CustomFormat[], index: number): Exclude<CustomFormat, GroupCustomFormat> {
	const format = formats[index];
	if (!format || format.kind === 'group') throw new Error(`expected a selectable format at ${index}`);
	return format;
}

afterEach(() => vi.restoreAllMocks());

describe('buildCustomFormats: parsing the option', () => {
	test('maps each valid entry to one mark + one toolbar format', () => {
		const { extensions, formats } = buildCustomFormats(SAMPLE);
		expect(extensions).toHaveLength(1);
		expect(formats).toHaveLength(1);
		expect(formats[0]!.title).toBe('Highlight');
		expect(typeof leafAt(formats, 0).name).toBe('string');
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
		expect(leafAt(formats, 0).previewStyle).toContain('color: #00ff00');
		expect(leafAt(formats, 0).previewStyle).toContain('font-size: 20px');
	});

	test('previewStyle is undefined when a format has no styles', () => {
		const { formats } = buildCustomFormats([{ title: 'Plain', inline: 'span', classes: 'plain' }]);
		expect(leafAt(formats, 0).previewStyle).toBeUndefined();
	});

	test('assigns each format a distinct mark name', () => {
		const { formats } = buildCustomFormats([
			{ title: 'A', inline: 'span', classes: 'a' },
			{ title: 'B', inline: 'span', classes: 'b' },
		]);

		expect(new Set([leafAt(formats, 0).name, leafAt(formats, 1).name]).size).toBe(2);
	});
});

describe('buildCustomFormats: applying a format', () => {
	test('wraps the selection in the configured tag, class, styles and attributes', () => {
		const { extensions, formats } = buildCustomFormats(SAMPLE);
		const editor = new Editor({ extensions: [...editorExtensions, ...extensions], content: '<p>hello</p>' });
		editor.commands.selectAll();
		editor.commands.toggleMark(leafAt(formats, 0).name);

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
		editor.commands.toggleMark(leafAt(formats, 0).name);
		editor.commands.selectAll();
		editor.commands.toggleMark(leafAt(formats, 0).name);

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

		// `title` is a preserved global attribute, so it renders in the global-attr slot (with class)
		// ahead of the format's own `style`; single span, single title
		expect(out).toBe('<p><span class="hl" title="Highlighted" style="color: #00ff00; font-size: 20px;">x</span></p>');
	});

	test('coexists with text color: format applied over colored text keeps the color', () => {
		const { extensions, formats } = buildCustomFormats(SAMPLE);

		const editor = new Editor({
			extensions: [...editorExtensions, ...extensions],
			content: '<p><span style="color: red">hi</span></p>',
		});

		editor.commands.selectAll();
		editor.commands.toggleMark(leafAt(formats, 0).name);
		const html = editor.getHTML();
		editor.destroy();

		expect(html).toContain('class="hl"');
		expect(html).toContain('color: red');
	});

	test('coexists with text color: color applied over a format keeps the format', () => {
		const { extensions, formats } = buildCustomFormats(SAMPLE);
		const editor = new Editor({ extensions: [...editorExtensions, ...extensions], content: '<p>hi</p>' });

		editor.commands.selectAll();
		editor.commands.toggleMark(leafAt(formats, 0).name);
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

	test('extra preserved attributes on a format span round-trip without duplicating the format class', () => {
		const editor = editorWith(SAMPLE, '<p><span class="hl extra" id="x" data-k="v">t</span></p>');
		const out = editor.getHTML();
		editor.destroy();

		expect(out).toBe(
			'<p><span class="hl extra" id="x" data-k="v" style="color: #00ff00; font-size: 20px;" title="Highlighted">t</span></p>',
		);
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
		const active = editor.isActive(leafAt(formats, 0).name);
		editor.destroy();

		expect(active).toBe(true);
	});
});

/** Narrow to a block format, failing the test rather than returning undefined. */
function blockAt(formats: CustomFormat[], index: number): BlockCustomFormat {
	const format = formats[index];
	if (format?.kind !== 'block') throw new Error(`expected a block format at ${index}, got ${format?.kind}`);
	return format;
}

describe('buildCustomFormats: block entries', () => {
	test('tags an inline entry as an inline format', () => {
		const { formats } = buildCustomFormats(SAMPLE);
		expect(formats[0]!.kind).toBe('inline');
	});

	test('builds a block entry with no extension — attributes round-trip via PreservedAttributes', () => {
		const { extensions, formats } = buildCustomFormats([{ title: 'Dropcap', block: 'p', classes: 'dropcap' }]);

		expect(extensions).toHaveLength(0);
		expect(formats).toHaveLength(1);

		expect(blockAt(formats, 0)).toMatchObject({
			kind: 'block',
			title: 'Dropcap',
			targets: [{ type: 'paragraph' }],
			convert: true,
			classes: ['dropcap'],
			attributes: {},
		});
	});

	test('maps a heading tag to the heading node type plus its level', () => {
		const { formats } = buildCustomFormats([{ title: 'Eyebrow', block: 'h2', classes: 'eyebrow' }]);

		expect(blockAt(formats, 0).targets).toEqual([{ type: 'heading', attrs: { level: 2 } }]);
		expect(blockAt(formats, 0).convert).toBe(true);
	});

	test('a selector entry matches without converting', () => {
		const { formats } = buildCustomFormats([{ title: 'Eyebrow', selector: 'p', classes: 'eyebrow' }]);

		expect(blockAt(formats, 0).convert).toBe(false);
		expect(blockAt(formats, 0).targets).toEqual([{ type: 'paragraph' }]);
	});

	test('a selector entry accepts a comma-separated tag list', () => {
		const { formats } = buildCustomFormats([{ title: 'Eyebrow', selector: 'h2, h3', classes: 'eyebrow' }]);

		expect(blockAt(formats, 0).targets).toEqual([
			{ type: 'heading', attrs: { level: 2 } },
			{ type: 'heading', attrs: { level: 3 } },
		]);
	});

	test('skips a `block` entry naming more than one tag — it can only convert to one', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const { formats } = buildCustomFormats([{ title: 'Eyebrow', block: 'h2,h3', classes: 'eyebrow' }]);

		expect(formats).toHaveLength(0);
		expect(warn).toHaveBeenCalledTimes(1);
	});

	// The community thread asks for a `float-left` class on an image and TinyMCE configs routinely
	// target list items and table cells, so every node type the editor models must be selectable.
	test.each([
		['img', { type: 'image' }],
		['hr', { type: 'horizontalRule' }],
		['li', { type: 'listItem' }],
		['ul', { type: 'bulletList' }],
		['ol', { type: 'orderedList' }],
		['table', { type: 'table' }],
		['tr', { type: 'tableRow' }],
		['td', { type: 'tableCell' }],
		['th', { type: 'tableHeader' }],
		['video', { type: 'media', attrs: { tag: 'video' } }],
		['audio', { type: 'media', attrs: { tag: 'audio' } }],
		['iframe', { type: 'media', attrs: { tag: 'iframe' } }],
		['summary', { type: 'detailsSummary' }],
		['dl', { type: 'descriptionList' }],
		['dt', { type: 'descriptionTerm' }],
		['dd', { type: 'descriptionDetails' }],
	])('maps the `%s` selector to the node type the editor models', (tag, target) => {
		const { formats } = buildCustomFormats([{ title: 'T', selector: tag, classes: 'x' }]);

		expect(blockAt(formats, 0).targets).toEqual([target]);
		expect(blockAt(formats, 0).convert).toBe(false);
	});

	test('a `block` entry on a non-convertible tag like img is match-only', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const { formats } = buildCustomFormats([{ title: 'Float', block: 'img', classes: 'float-left' }]);

		expect(blockAt(formats, 0)).toMatchObject({ convert: false, targets: [{ type: 'image' }] });
		expect(warn).toHaveBeenCalledTimes(1);
	});

	test('splits multiple classes so toggling off can strip exactly its own', () => {
		const { formats } = buildCustomFormats([{ title: 'Two', block: 'p', classes: 'a  b' }]);
		expect(blockAt(formats, 0).classes).toEqual(['a', 'b']);
	});

	test('block entries expose styles as a dropdown preview, never as an applied attribute', () => {
		const { formats } = buildCustomFormats([
			{ title: 'Big', block: 'p', classes: 'big', styles: { 'font-size': '20px' } },
		]);

		expect(leafAt(formats, 0).previewStyle).toBe('font-size: 20px');
		expect(blockAt(formats, 0).attributes).toEqual({});
	});

	test('keeps only attributes PreservedAttributes round-trips, warning about the rest', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const { formats } = buildCustomFormats([
			{
				title: 'Anchored',
				block: 'p',
				classes: 'anchored',
				attributes: { id: 'a', 'data-k': 'v', 'aria-label': 'l', rel: 'nofollow' },
			},
		]);

		expect(blockAt(formats, 0).attributes).toEqual({ id: 'a', 'data-k': 'v', 'aria-label': 'l' });
		expect(warn).toHaveBeenCalledTimes(1);
	});

	test('folds a `class` attribute into the format classes so toggling off can strip it', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const { formats } = buildCustomFormats([{ title: 'Both', block: 'p', classes: 'a', attributes: { class: 'b c' } }]);

		expect(blockAt(formats, 0).classes).toEqual(['a', 'b', 'c']);
		expect(blockAt(formats, 0).attributes).toEqual({});
		expect(warn).not.toHaveBeenCalled();
	});

	test('an attributes-only block entry is anchored on its attributes', () => {
		const { formats } = buildCustomFormats([{ title: 'Latex', block: 'p', attributes: { 'data-latex': 'true' } }]);

		expect(formats).toHaveLength(1);
		expect(blockAt(formats, 0).classes).toEqual([]);
	});

	test('skips a block entry left without an anchor once unsupported attributes are dropped', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const { formats } = buildCustomFormats([
			{ title: 'Red', block: 'h2', attributes: { style: 'color: red' } },
			{ title: 'Empty class', block: 'h2', attributes: { class: '' } },
		]);

		expect(formats).toHaveLength(0);
		expect(warn).toHaveBeenCalled();
	});

	test('downgrades a block entry whose tag cannot be converted to, with a warning', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const { formats } = buildCustomFormats([
			{ title: 'Pull', block: 'blockquote', classes: 'pull' },
			{ title: 'Shell', block: 'pre', classes: 'shell' },
		]);

		expect(formats).toHaveLength(2);
		expect(blockAt(formats, 0)).toMatchObject({ convert: false, targets: [{ type: 'blockquote' }] });
		expect(blockAt(formats, 1)).toMatchObject({ convert: false, targets: [{ type: 'codeBlock' }] });
		expect(warn).toHaveBeenCalledTimes(2);
	});

	test('skips tags the editor does not model as blocks, with a warning', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const { formats } = buildCustomFormats([
			{ title: 'Div', block: 'div', classes: 'wrap' },
			{ title: 'Main', selector: 'main', classes: 'page' },
			{ title: 'Span', selector: 'span', classes: 'x' },
		]);

		expect(formats).toHaveLength(0);
		// each entry warns twice: once for the unmodelled tag, once for the entry left without targets
		expect(warn).toHaveBeenCalledTimes(6);
	});

	test('keeps a selector entry when only some of its tags are unmodelled', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const { formats } = buildCustomFormats([{ title: 'Lead', selector: 'h2,div,p', classes: 'lead' }]);

		expect(formats).toHaveLength(1);

		expect(blockAt(formats, 0)).toMatchObject({
			convert: false,
			targets: [{ type: 'heading', attrs: { level: 2 } }, { type: 'paragraph' }],
		});

		expect(warn).toHaveBeenCalledTimes(1);
	});

	test('skips compound CSS selectors instead of silently no-opping', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const { formats } = buildCustomFormats([
			{ title: 'Compound', selector: 'p.lead', classes: 'x' },
			{ title: 'Descendant', selector: 'div p', classes: 'x' },
			{ title: 'Attr', selector: 'p[data-k]', classes: 'x' },
			{ title: 'Child', selector: 'div > p', classes: 'x' },
			{ title: 'Id', selector: '#main', classes: 'x' },
		]);

		expect(formats).toHaveLength(0);
		expect(warn).toHaveBeenCalledTimes(10);
	});

	test('still skips wrapper entries (out of scope) with a warning', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const { formats } = buildCustomFormats([{ title: 'Section', wrapper: true, block: 'section', classes: 'hero' }]);

		expect(formats).toHaveLength(0);
		expect(warn).toHaveBeenCalledTimes(1);
	});

	test('still requires a classes/attributes anchor on block entries', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const { formats } = buildCustomFormats([{ title: 'Bare', block: 'p' }]);

		expect(formats).toHaveLength(0);
		expect(warn).toHaveBeenCalledTimes(1);
	});

	test('names block formats distinctly from each other and from inline formats', () => {
		const { formats } = buildCustomFormats([
			{ title: 'A', inline: 'span', classes: 'a' },
			{ title: 'B', block: 'p', classes: 'b' },
			{ title: 'C', selector: 'h2', classes: 'c' },
		]);

		const names = formats.map((format) => (format.kind === 'group' ? format.title : format.name));
		expect(new Set(names).size).toBe(3);
	});
});

describe('buildCustomFormats: groups', () => {
	const GROUPED = [
		{
			title: 'Paragraphs',
			items: [
				{ title: 'Dropcap', block: 'p', classes: 'dropcap' },
				{ title: 'Latex', block: 'p', classes: 'latex' },
			],
		},
	];

	test('builds an items entry as a group of its child formats', () => {
		const { formats } = buildCustomFormats(GROUPED);

		expect(formats).toHaveLength(1);
		const group = formats[0]!;
		if (group.kind !== 'group') throw new Error('expected a group');

		expect(group.title).toBe('Paragraphs');
		expect(group.items.map((item) => item.title)).toEqual(['Dropcap', 'Latex']);
	});

	test('group children get distinct names', () => {
		const { formats } = buildCustomFormats([...GROUPED, { title: 'Lead', inline: 'span', classes: 'lead' }]);
		const group = formats[0]!;
		if (group.kind !== 'group') throw new Error('expected a group');

		const names = [...group.items, formats[1]!].map((item) => (item.kind === 'group' ? '' : item.name));
		expect(new Set(names).size).toBe(3);
	});

	test('every inline child of a group contributes its mark extension', () => {
		const { extensions, formats } = buildCustomFormats([
			{
				title: 'Inline group',
				items: [
					{ title: 'Highlight', inline: 'span', classes: 'hl' },
					{ title: 'Lead', inline: 'span', classes: 'lead' },
				],
			},
		]);

		expect(extensions).toHaveLength(2);
		expect(formats).toHaveLength(1);
	});

	test('skips a group whose children are all unsupported', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const { formats } = buildCustomFormats([{ title: 'Empty', items: [{ title: 'Div', block: 'div' }] }]);

		expect(formats).toHaveLength(0);
		expect(warn).toHaveBeenCalled();
	});

	test('skips a group nested inside a group (one level only)', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const { formats } = buildCustomFormats([
			{
				title: 'Outer',
				items: [
					{ title: 'Inner', items: [{ title: 'Dropcap', block: 'p', classes: 'dropcap' }] },
					{ title: 'Lead', inline: 'span', classes: 'lead' },
				],
			},
		]);

		const group = formats[0]!;
		if (group.kind !== 'group') throw new Error('expected a group');

		expect(group.items.map((item) => item.title)).toEqual(['Lead']);
		expect(warn).toHaveBeenCalledTimes(1);
	});
});

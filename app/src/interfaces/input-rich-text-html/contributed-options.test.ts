import type { RichTextConfig, RichTextToolbarButton } from '@directus/extensions';
import { type AnyExtension, mergeAttributes, Node } from '@tiptap/core';
import { Editor } from '@tiptap/vue-3';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { computeValueNormalizationDiff } from './composables/normalization-diff';
import { buildFieldSchema, fieldEditorExtensions, type FieldSchemaOptions } from './extensions';
import { registerRichTexts } from '@/rich-text/register';
import { validateRichTexts } from '@/rich-text/validate';

const Callout = Node.create<{ tones: string[] }>({
	name: 'callout',
	group: 'block',
	content: 'block+',
	addOptions: () => ({ tones: [] }),
	addAttributes() {
		return {
			tone: {
				default: this.options.tones[0] ?? null,
				parseHTML: (element) => element.getAttribute('data-tone'),
				renderHTML: (attributes) => ({ 'data-tone': attributes['tone'] }),
			},
		};
	},
	parseHTML: () => [{ tag: 'div[data-callout]' }],
	renderHTML: ({ HTMLAttributes }) => ['div', mergeAttributes(HTMLAttributes, { 'data-callout': '' }), 0],
});

const callout = (
	overrides: Partial<RichTextConfig<{ tones: string[] }>> = {},
): RichTextConfig<{ tones: string[] }> => ({
	id: 'callout',
	name: 'Callout',
	options: [{ field: 'tones', type: 'json', schema: { default_value: ['info', 'warning'] } }],
	extensions: ({ tones }) => [Callout.configure({ tones })],
	buttons: ({ tones }) => [
		{
			key: 'tone',
			icon: 'info',
			label: 'Callout',
			items: tones.map((tone) => ({ key: tone, label: tone, command: () => {} })),
		},
	],
	...overrides,
});

const register = (...configs: unknown[]) => registerRichTexts(validateRichTexts(configs));

const schema = (extensionOptions?: FieldSchemaOptions['extensionOptions']) =>
	buildFieldSchema({ extensions: ['callout'], extensionOptions });

function render(html: string, extensions: AnyExtension[]) {
	const editor = new Editor({ extensions: fieldEditorExtensions(extensions), content: html });
	const out = editor.getHTML();
	editor.destroy();
	return out;
}

let error: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	error = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
	registerRichTexts([]);
	error.mockRestore();
});

const itemKeys = (buttons: RichTextToolbarButton[]) => buttons[0]!.items!.map((item) => item.key);

describe('per-extension field options', () => {
	test('builds the extension from the option defaults when the field stored nothing', () => {
		register(callout());
		const { extensions, buttons } = schema();

		expect(render('<div data-callout=""><p>x</p></div>', extensions)).toContain('data-tone="info"');
		expect(itemKeys(buttons)).toEqual(['info', 'warning']);
	});

	test("builds the extension from the field's stored values", () => {
		register(callout());
		const { extensions, buttons } = schema({ callout: { tones: ['danger'] } });

		expect(render('<div data-callout=""><p>x</p></div>', extensions)).toContain('data-tone="danger"');
		expect(itemKeys(buttons)).toEqual(['danger']);
	});

	test('keeps the defaults of options the field did not store', () => {
		const factory = vi.fn(({ tones }) => [Callout.configure({ tones })]);

		register(
			callout({
				options: [
					{ field: 'tones', type: 'json', schema: { default_value: ['info'] } },
					{ field: 'icon', type: 'string', schema: { default_value: 'star' } },
				],
				extensions: factory,
			}),
		);

		schema({ callout: { tones: ['danger'] } });

		expect(factory).toHaveBeenLastCalledWith({ tones: ['danger'], icon: 'star' });
	});

	// two fields with different values must not share a cached normalization verdict
	test('gives fields with different values different schema keys', () => {
		register(callout());

		expect(schema({ callout: { tones: ['danger'] } }).key).not.toBe(schema().key);
		expect(schema({ callout: { tones: ['info', 'warning'] } }).key).toBe(schema().key);
	});

	test('gives the same key whatever order the values were saved in', () => {
		register(
			callout({
				options: [
					{ field: 'a', type: 'integer' },
					{ field: 'b', type: 'integer' },
				],
			}),
		);

		expect(schema({ callout: { a: 1, b: 2 } }).key).toBe(schema({ callout: { b: 2, a: 1 } }).key);
	});

	test('runs a factory once per set of values', () => {
		const factory = vi.fn(({ tones }) => [Callout.configure({ tones })]);
		register(callout({ extensions: factory }));
		factory.mockClear();

		schema({ callout: { tones: ['danger'] } });
		schema({ callout: { tones: ['danger'] } });

		expect(factory).toHaveBeenCalledOnce();
	});

	test('reads stored content back under the same values', () => {
		register(callout());
		const { extensions, key } = schema({ callout: { tones: ['danger'] } });

		expect(
			computeValueNormalizationDiff('<div data-callout="" data-tone="danger"><p>x</p></div>', extensions, key),
		).toBeNull();
	});

	test('keeps a plain-array extension working beside a factory one', () => {
		const Plain = Node.create({
			name: 'plain',
			group: 'block',
			content: 'block+',
			parseHTML: () => [{ tag: 'section[data-plain]' }],
			renderHTML: () => ['section', { 'data-plain': '' }, 0],
		});

		register(callout(), { id: 'plain', name: 'Plain', extensions: [Plain] });
		const { extensions } = buildFieldSchema({ extensions: ['callout', 'plain'] });

		expect(extensions.map((extension) => extension.name)).toEqual(['callout', 'plain']);
	});
});

describe('a factory that fails for a field', () => {
	test('leaves the extension out of that field only', () => {
		register(
			callout({
				extensions: ({ tones }) => {
					if (!Array.isArray(tones)) throw new Error('tones must be a list');
					return [Callout.configure({ tones })];
				},
			}),
		);

		expect(schema({ callout: { tones: 'danger' } }).extensions).toEqual([]);
		expect(schema().extensions).toHaveLength(1);
		expect(error.mock.calls[0]!.join(' ')).toContain('tones must be a list');
	});

	// content saved under one value must still parse under another
	test('leaves the extension out when the values change the node names', () => {
		const Renamed = Callout.extend({ name: 'renamed' });

		register(
			callout({
				extensions: ({ tones }) => [(tones.length > 2 ? Renamed : Callout).configure({ tones })],
			}),
		);

		expect(schema({ callout: { tones: ['a', 'b', 'c'] } }).extensions).toEqual([]);
		expect(error.mock.calls[0]!.join(' ')).toContain('[renamed] instead of [callout]');
	});

	test('leaves the extension out when the values return a broken button', () => {
		register(
			callout({
				buttons: ({ tones }) =>
					tones.map((tone) => ({
						key: tone,
						label: tone,
						icon: tone === 'danger' ? undefined : 'info',
						command: () => {},
					})) as RichTextToolbarButton[],
			}),
		);

		const { buttons, extensions } = schema({ callout: { tones: ['danger'] } });

		expect(buttons).toEqual([]);
		expect(extensions).toEqual([]);
		expect(error.mock.calls[0]!.join(' ')).toContain('button "danger" needs an "icon" string');
	});

	test('reports a failing set of values once', () => {
		register(
			callout({
				extensions: ({ tones }) => {
					if (tones.length === 0) throw new Error('boom');
					return [Callout.configure({ tones })];
				},
			}),
		);

		schema({ callout: { tones: [] } });
		schema({ callout: { tones: [] } });

		expect(error).toHaveBeenCalledOnce();
		expect(error.mock.calls[0]!.join(' ')).toContain('was left out of a field');
	});
});

describe('validation at load', () => {
	test('runs the factories with the defaults and rejects what they return', () => {
		register(callout({ buttons: () => [{ key: 'tone' } as RichTextToolbarButton] }));

		expect(schema().extensions).toEqual([]);
		expect(error.mock.calls[0]!.join(' ')).toContain('"callout" was not loaded: button "tone" needs an "icon" string');
	});

	test('rejects an extension whose factory throws with the defaults', () => {
		register(
			callout({
				extensions: () => {
					throw new Error('boom');
				},
			}),
		);

		expect(error.mock.calls[0]!.join(' ')).toContain('extension threw while being validated: boom');
	});

	test.each([
		['a non-array options', { options: { field: 'tones' } }],
		['an option without a field', { options: [{ type: 'string' }] }],
		['an option defined twice', { options: [{ field: 'tones' }, { field: 'tones' }] }],
		['an option without a type', { options: [{ field: 'tones' }] }],
		['an option whose meta is not an object', { options: [{ field: 'tones', type: 'json', meta: 'half' }] }],
		['a non-function non-array buttons', { buttons: 'nope' }],
	])('rejects %s', (_, overrides) => {
		register(callout(overrides as Partial<RichTextConfig<{ tones: string[] }>>));

		expect(error).toHaveBeenCalledOnce();
		expect(schema().extensions).toEqual([]);
	});
});
